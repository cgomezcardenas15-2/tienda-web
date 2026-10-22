import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function limpiar(body: Record<string, unknown>) {
  const texto = (valor: unknown) => typeof valor === "string" ? valor.trim() : "";
  const precio = texto(body.precio);
  const precioMayorista = texto(body.precio_mayorista);
  const minimoMayorista = texto(body.cantidad_minima_mayorista);
  return {
    productoId: texto(body.productoId), nombre: texto(body.nombre), color: texto(body.color) || null,
    talla: texto(body.talla) || null, sku: texto(body.sku).toUpperCase(),
    precio: precio === "" ? null : Number(precio),
    precioMayorista: precioMayorista === "" ? null : Number(precioMayorista),
    minimoMayorista: minimoMayorista === "" ? null : Number(minimoMayorista),
    stock: Number(body.stock), imagenUrl: texto(body.imagen_url) || null, activo: body.activo !== false,
  };
}

function mensajeRedistribucion(error: { code?: string; message?: string }) {
  const mensaje = error.message ?? "";
  if (error.code === "23505" || mensaje.includes("SKU ya está utilizado")) return "Ese SKU ya está utilizado.";
  if (mensaje.includes("Solo quedan")) return `${mensaje}. No se modificó el inventario.`;
  if (mensaje.includes("inventario cambió")) return "El inventario cambió mientras guardabas. Recarga la página e inténtalo nuevamente.";
  if (error.code === "PGRST202") return "Falta activar la protección de inventario por colores en la base de datos.";
  return "No fue posible guardar el color. El inventario no fue modificado.";
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiar(body);
  if (!datos.productoId || !datos.nombre || !datos.sku || !Number.isSafeInteger(datos.stock) || datos.stock < 0 ||
      datos.precio !== null && (!Number.isInteger(datos.precio) || datos.precio < 0) ||
      datos.precioMayorista !== null && (!Number.isInteger(datos.precioMayorista) || datos.precioMayorista < 0) ||
      datos.minimoMayorista !== null && (!Number.isInteger(datos.minimoMayorista) || datos.minimoMayorista < 2) ||
      (datos.precioMayorista === null) !== (datos.minimoMayorista === null)) {
    return NextResponse.json({ error: "Completa correctamente precio, stock y datos mayoristas." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.rpc("guardar_variante_redistribuyendo_stock", {
    p_producto_id: datos.productoId, p_variante_id: null, p_stock_esperado: 0,
    p_stock_objetivo: datos.stock, p_nombre: datos.nombre, p_color: datos.color,
    p_talla: datos.talla, p_sku: datos.sku, p_precio: datos.precio,
    p_precio_mayorista: datos.precioMayorista, p_cantidad_minima_mayorista: datos.minimoMayorista,
    p_imagen_url: datos.imagenUrl, p_activo: datos.activo,
  });
  if (error) {
    console.error("Error redistribuyendo stock al crear color:", { code: error.code, message: error.message });
    const conflicto = error.code === "23505" || error.message.includes("Solo quedan") || error.message.includes("inventario cambió");
    return NextResponse.json({ error: mensajeRedistribucion(error) }, { status: conflicto ? 409 : 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
