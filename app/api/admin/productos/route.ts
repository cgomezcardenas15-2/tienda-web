import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { crearSkuColor } from "@/app/lib/coloresProducto";
import { errorValidacionProducto, limpiarProducto } from "@/app/lib/productoAdmin";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type VarianteNueva = {
  nombre: string;
  color: string;
  sku: string;
  stock: number;
  orden: number;
};

function limpiarVariantes(body: Record<string, unknown>, skuBase: string) {
  if (body.variantes === undefined) return { variantes: [] as VarianteNueva[], error: null };
  if (!Array.isArray(body.variantes)) return { variantes: [] as VarianteNueva[], error: "Los colores enviados no son válidos." };
  if (body.variantes.length > 30) return { variantes: [] as VarianteNueva[], error: "Puedes crear hasta 30 colores por producto." };

  const variantes: VarianteNueva[] = [];
  const coloresUsados = new Set<string>();
  const nombresUsados = new Set<string>();
  const skusUsados = new Set<string>();

  for (const [orden, valor] of body.variantes.entries()) {
    if (!valor || typeof valor !== "object") return { variantes: [], error: "Revisa la información de los colores." };
    const item = valor as Record<string, unknown>;
    const nombre = typeof item.nombre === "string" ? item.nombre.trim() : "";
    const color = typeof item.color === "string" ? item.color.trim().toLowerCase() : "";
    const stock = typeof item.stock === "string" && item.stock.trim() === "" ? Number.NaN : Number(item.stock);

    if (!nombre || nombre.length > 50) return { variantes: [], error: "Cada color debe tener un nombre de hasta 50 caracteres." };
    if (!/^#[0-9a-f]{6}$/i.test(color)) return { variantes: [], error: `El tono de ${nombre} no es válido.` };
    if (!Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647) return { variantes: [], error: `El stock de ${nombre} no es válido.` };

    const nombreNormalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const sku = crearSkuColor(skuBase, nombre, color);
    if (coloresUsados.has(color) || nombresUsados.has(nombreNormalizado) || skusUsados.has(sku)) {
      return { variantes: [], error: "No repitas colores ni nombres dentro del mismo producto." };
    }

    coloresUsados.add(color);
    nombresUsados.add(nombreNormalizado);
    skusUsados.add(sku);
    variantes.push({ nombre, color, sku, stock, orden });
  }

  return { variantes, error: null };
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiarProducto(body);
  const validacion = errorValidacionProducto(datos);
  if (validacion) return NextResponse.json({ error: validacion }, { status: 400 });
  const resultadoVariantes = body.usa_variantes === true
    ? limpiarVariantes(body, datos.sku)
    : { variantes: [] as VarianteNueva[], error: null };
  if (resultadoVariantes.error) return NextResponse.json({ error: resultadoVariantes.error }, { status: 400 });
  if (body.usa_variantes === true && resultadoVariantes.variantes.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos un color para el producto." }, { status: 400 });
  }
  if (resultadoVariantes.variantes.length > 0) {
    datos.controla_stock = true;
    datos.stock = 0;
  }
  const { data: categoria, error: errorCategoria } = await supabaseAdmin
    .from("categorias_producto")
    .select("id")
    .eq("nombre", datos.categoria)
    .eq("activo", true)
    .maybeSingle();
  if (errorCategoria) return NextResponse.json({ error: "No fue posible verificar la categoría." }, { status: 500 });
  if (!categoria) return NextResponse.json({ error: "La categoría seleccionada no existe o está desactivada." }, { status: 400 });

  if (datos.subcategoria_id) {
    const { data: subcategoria, error: errorSubcategoria } = await supabaseAdmin
      .from("subcategorias_producto")
      .select("id,categoria_id,activo")
      .eq("id", datos.subcategoria_id)
      .maybeSingle();
    if (errorSubcategoria) return NextResponse.json({ error: "No fue posible verificar la subcategoría." }, { status: 500 });
    if (!subcategoria || !subcategoria.activo || subcategoria.categoria_id !== categoria.id) {
      return NextResponse.json({ error: "La subcategoría no pertenece a la categoría seleccionada o está oculta." }, { status: 400 });
    }
  }

  const skusSolicitados = [datos.sku, ...resultadoVariantes.variantes.map((variante) => variante.sku)];
  const [{ data: productosConSku, error: errorSkusProductos }, { data: variantesConSku, error: errorSkusVariantes }] = await Promise.all([
    supabaseAdmin.from("productos").select("sku").in("sku", skusSolicitados).limit(1),
    supabaseAdmin.from("variantes_producto").select("sku").in("sku", skusSolicitados).limit(1),
  ]);
  if (errorSkusProductos || errorSkusVariantes) {
    console.error("Error validando SKU al crear producto:", errorSkusProductos?.message || errorSkusVariantes?.message);
    return NextResponse.json({ error: "No fue posible validar los SKU. Intenta nuevamente." }, { status: 500 });
  }
  if ((productosConSku?.length ?? 0) > 0 || (variantesConSku?.length ?? 0) > 0) {
    return NextResponse.json({ error: "El SKU principal o el de uno de los colores ya está utilizado." }, { status: 409 });
  }

  const activoSolicitado = datos.activo;
  const datosIniciales = resultadoVariantes.variantes.length > 0 ? { ...datos, activo: false } : datos;
  const { data, error } = await supabaseAdmin.from("productos").insert(datosIniciales).select("*").single();
  if (error) {
    console.error("Error creando producto:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.code === "23505" ? "Ya existe un producto con ese nombre o SKU." : "No fue posible crear el producto." }, { status: 409 });
  }

  if (resultadoVariantes.variantes.length > 0) {
    const { data: variantes, error: errorVariantes } = await supabaseAdmin
      .from("variantes_producto")
      .insert(resultadoVariantes.variantes.map((variante) => ({
        producto_id: data.id,
        ...variante,
        controla_stock: true,
        activo: true,
      })))
      .select("*");

    if (errorVariantes) {
      const { error: errorLimpieza } = await supabaseAdmin.from("productos").delete().eq("id", data.id);
      console.error("Error creando colores del producto:", {
        code: errorVariantes.code,
        message: errorVariantes.message,
        rollback: errorLimpieza?.message,
      });
      if (errorLimpieza) {
        return NextResponse.json({
          error: "No fue posible completar los colores. El producto quedó suspendido para evitar ventas; revisa el catálogo.",
          productoId: data.id,
        }, { status: 500 });
      }
      return NextResponse.json({
        error: errorVariantes.code === "23505"
          ? "El SKU de uno de los colores ya está utilizado. Cambia el SKU principal o el nombre del color."
          : "No fue posible guardar los colores. El producto no fue creado.",
      }, { status: 409 });
    }

    if (activoSolicitado) {
      const { data: productoActivo, error: errorActivacion } = await supabaseAdmin
        .from("productos")
        .update({ activo: true })
        .eq("id", data.id)
        .select("*")
        .single();
      if (errorActivacion) {
        console.error("Producto con colores creado pero no activado:", { productoId: data.id, message: errorActivacion.message });
        return NextResponse.json({
          ok: true,
          producto: data,
          variantes,
          advertencia: "El producto y sus colores se guardaron, pero quedó suspendido. Actívalo desde su ficha.",
        }, { status: 201 });
      }
      return NextResponse.json({ ok: true, producto: productoActivo, variantes }, { status: 201 });
    }

    return NextResponse.json({ ok: true, producto: data, variantes }, { status: 201 });
  }

  return NextResponse.json({ ok: true, producto: data, variantes: [] }, { status: 201 });
}
