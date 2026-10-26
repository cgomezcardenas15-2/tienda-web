import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { errorValidacionProducto, limpiarProducto } from "@/app/lib/productoAdmin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiarProducto(body);
  const validacion = errorValidacionProducto(datos);
  if (validacion) return NextResponse.json({ error: validacion }, { status: 400 });
  const [consultaCategoria, consultaProducto, consultaVariante] = await Promise.all([
    supabaseAdmin.from("categorias_producto").select("id,activo").eq("nombre", datos.categoria).maybeSingle(),
    supabaseAdmin.from("productos").select("categoria,subcategoria_id,stock").eq("id", id).maybeSingle(),
    supabaseAdmin.from("variantes_producto").select("id").eq("producto_id", id).limit(1).maybeSingle(),
  ]);
  if (consultaCategoria.error || consultaProducto.error || consultaVariante.error) {
    console.error("Error preparando actualización de producto:", {
      categoria: consultaCategoria.error?.message,
      producto: consultaProducto.error?.message,
      variante: consultaVariante.error?.message,
    });
    return NextResponse.json({ error: "No fue posible verificar el inventario del producto." }, { status: 500 });
  }
  const categoria = consultaCategoria.data;
  const productoActual = consultaProducto.data;
  const varianteExistente = consultaVariante.data;
  if (!productoActual) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  if (!categoria || (!categoria.activo && datos.categoria !== productoActual.categoria)) {
    return NextResponse.json({ error: "La categoría seleccionada no existe o está desactivada." }, { status: 400 });
  }
  if (datos.subcategoria_id) {
    const { data: subcategoria, error: errorSubcategoria } = await supabaseAdmin
      .from("subcategorias_producto")
      .select("id,categoria_id,activo")
      .eq("id", datos.subcategoria_id)
      .maybeSingle();
    if (errorSubcategoria) return NextResponse.json({ error: "No fue posible verificar la subcategoría." }, { status: 500 });
    const conservaSubcategoria = datos.subcategoria_id === productoActual.subcategoria_id;
    if (!subcategoria || subcategoria.categoria_id !== categoria.id || (!subcategoria.activo && !conservaSubcategoria)) {
      return NextResponse.json({ error: "La subcategoría no pertenece a la categoría seleccionada o está oculta." }, { status: 400 });
    }
  }
  // Con colores, productos.stock es únicamente la cantidad aún sin color.
  // Esos campos se omiten para que una edición general nunca restaure un valor viejo.
  const cambios = varianteExistente
    ? { ...Object.fromEntries(Object.entries(datos).filter(([campo]) => campo !== "stock" && campo !== "controla_stock")), controla_stock: true }
    : datos;

  let actualizacion = supabaseAdmin.from("productos").update(cambios).eq("id", id);
  // Si todavía no había colores, esta comparación evita que una creación
  // simultánea de color sea sobrescrita por un formulario viejo.
  if (!varianteExistente) actualizacion = actualizacion.eq("stock", Number(productoActual.stock));
  const { data, error } = await actualizacion.select("*").maybeSingle();
  if (error) {
    console.error("Error actualizando producto:", { code: error.code, message: error.message });
    const mensaje = error.code === "23505"
      ? "Ya existe un producto con ese nombre o SKU."
      : process.env.NODE_ENV === "development"
        ? `No fue posible actualizar: ${error.message}`
        : "No fue posible actualizar el producto.";
    return NextResponse.json({ error: mensaje }, { status: 409 });
  }
  if (!data) return NextResponse.json({ error: "El inventario cambió mientras guardabas. Recarga la página e inténtalo nuevamente." }, { status: 409 });
  return NextResponse.json({ ok: true, producto: data });
}
