import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type TallaSolicitud = { talla?: unknown; stock?: unknown; sku?: unknown };

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function precioOpcional(valor: unknown) {
  const limpio = texto(valor);
  return limpio === "" ? null : Number(limpio);
}

function mensajeLote(error: { code?: string; message?: string }) {
  const mensaje = error.message ?? "";
  if (error.code === "23505" || mensaje.includes("SKU") || mensaje.includes("combinaciones")) return mensaje || "Uno de los SKU ya está utilizado.";
  if (mensaje.includes("Solo quedan")) return `${mensaje}. No se modificó el inventario.`;
  if (mensaje.includes("inventario cambió")) return "El inventario cambió mientras guardabas. Recarga la página e inténtalo nuevamente.";
  if (error.code === "PGRST202") return "Falta activar el guardado conjunto de tallas en la base de datos.";
  return "No fue posible guardar las tallas. El inventario no fue modificado.";
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });

  const productoId = texto(body.productoId);
  const nombre = texto(body.nombre);
  const color = texto(body.color);
  const stockBaseEsperado = Number(body.stock_base_esperado);
  const precio = precioOpcional(body.precio);
  const precioMayorista = precioOpcional(body.precio_mayorista);
  const minimoMayorista = precioOpcional(body.cantidad_minima_mayorista);
  const tallasEntrada = Array.isArray(body.tallas) ? body.tallas as TallaSolicitud[] : [];
  const tallas = tallasEntrada.map((item) => ({
    talla: texto(item.talla),
    sku: texto(item.sku).toUpperCase(),
    stock: Number(item.stock),
  }));

  const tallasNormalizadas = tallas.map((item) => item.talla.toLocaleLowerCase("es"));
  const skusNormalizados = tallas.map((item) => item.sku.toUpperCase());
  const datosInvalidos = !productoId || !nombre || !color || !Number.isSafeInteger(stockBaseEsperado) || stockBaseEsperado < 0
    || tallas.length < 1 || tallas.length > 30
    || tallas.some((item) => !item.talla || !item.sku || !Number.isSafeInteger(item.stock) || item.stock < 0)
    || new Set(tallasNormalizadas).size !== tallas.length
    || new Set(skusNormalizados).size !== tallas.length
    || tallas.reduce((total, item) => total + item.stock, 0) > stockBaseEsperado
    || precio !== null && (!Number.isInteger(precio) || precio < 0)
    || precioMayorista !== null && (!Number.isInteger(precioMayorista) || precioMayorista < 0)
    || minimoMayorista !== null && (!Number.isInteger(minimoMayorista) || minimoMayorista < 2)
    || (precioMayorista === null) !== (minimoMayorista === null);
  if (datosInvalidos) return NextResponse.json({ error: "Revisa color, tallas, SKU, cantidades y datos mayoristas." }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("crear_variantes_lote_redistribuyendo_stock", {
    p_producto_id: productoId,
    p_stock_base_esperado: stockBaseEsperado,
    p_nombre: nombre,
    p_color: color,
    p_tallas: tallas,
    p_precio: precio,
    p_precio_mayorista: precioMayorista,
    p_cantidad_minima_mayorista: minimoMayorista,
    p_imagen_url: texto(body.imagen_url) || null,
    p_activo: body.activo !== false,
  });
  if (error) {
    console.error("Error creando combinaciones de color y talla:", { code: error.code, message: error.message });
    const conflicto = error.code === "23505" || error.message.includes("Solo quedan") || error.message.includes("inventario cambió") || error.message.includes("SKU") || error.message.includes("combinaciones");
    return NextResponse.json({ error: mensajeLote(error) }, { status: conflicto ? 409 : 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
