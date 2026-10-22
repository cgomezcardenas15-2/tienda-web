import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

async function autorizado(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin && Boolean(await getAdminSession());
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await autorizado(request)) return NextResponse.json({ error: "Sesión o solicitud no válida." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const texto = (valor: unknown) => typeof valor === "string" ? valor.trim() : "";
  const precio = texto(body.precio) === "" ? null : Number(texto(body.precio));
  const precioMayorista = texto(body.precio_mayorista) === "" ? null : Number(texto(body.precio_mayorista));
  const minimoMayorista = texto(body.cantidad_minima_mayorista) === "" ? null : Number(texto(body.cantidad_minima_mayorista));
  const stock = Number(body.stock);
  const sku = texto(body.sku).toUpperCase();
  if (!texto(body.nombre) || !sku || !Number.isSafeInteger(stock) || stock < 0 ||
      precio !== null && (!Number.isInteger(precio) || precio < 0) ||
      precioMayorista !== null && (!Number.isInteger(precioMayorista) || precioMayorista < 0) ||
      minimoMayorista !== null && (!Number.isInteger(minimoMayorista) || minimoMayorista < 2) ||
      (precioMayorista === null) !== (minimoMayorista === null)) {
    return NextResponse.json({ error: "Revisa nombre, SKU, precio, stock y datos mayoristas." }, { status: 400 });
  }
  const { data: varianteActual, error: errorVariante } = await supabaseAdmin
    .from("variantes_producto").select("id,producto_id,stock").eq("id", id).maybeSingle();
  if (errorVariante || !varianteActual) return NextResponse.json({ error: "La opción de color no existe." }, { status: 404 });

  const { data, error } = await supabaseAdmin.rpc("guardar_variante_redistribuyendo_stock", {
    p_producto_id: varianteActual.producto_id, p_variante_id: id,
    p_stock_esperado: Number(varianteActual.stock), p_stock_objetivo: stock,
    p_nombre: texto(body.nombre), p_color: texto(body.color) || null,
    p_talla: texto(body.talla) || null, p_sku: sku, p_precio: precio,
    p_precio_mayorista: precioMayorista, p_cantidad_minima_mayorista: minimoMayorista,
    p_imagen_url: texto(body.imagen_url) || null, p_activo: body.activo !== false,
  });
  if (error) {
    console.error("Error redistribuyendo stock al editar color:", { code: error.code, message: error.message });
    let mensaje = "No fue posible guardar el color. El inventario no fue modificado.";
    if (error.code === "23505" || error.message.includes("SKU ya está utilizado")) mensaje = "Ese SKU ya está utilizado.";
    else if (error.message.includes("Solo quedan")) mensaje = `${error.message}. No se modificó el inventario.`;
    else if (error.message.includes("inventario cambió")) mensaje = "El inventario cambió mientras guardabas. Recarga la página e inténtalo nuevamente.";
    else if (error.code === "PGRST202") mensaje = "Falta activar la protección de inventario por colores en la base de datos.";
    const conflicto = error.code === "23505" || error.message.includes("Solo quedan") || error.message.includes("inventario cambió");
    return NextResponse.json({ error: mensaje }, { status: conflicto ? 409 : 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await autorizado(request)) return NextResponse.json({ error: "Sesión o solicitud no válida." }, { status: 401 });
  const { id } = await params;
  const { data: variante, error: errorConsulta } = await supabaseAdmin.from("variantes_producto").select("id,stock").eq("id", id).maybeSingle();
  if (errorConsulta || !variante) return NextResponse.json({ error: "La opción de color no existe." }, { status: 404 });
  if (Number(variante.stock) > 0) return NextResponse.json({ error: "Primero cambia este color a 0. Sus unidades volverán al stock sin color y no se perderán." }, { status: 409 });
  const { data: eliminada, error } = await supabaseAdmin.from("variantes_producto").delete().eq("id", id).eq("stock", 0).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23503" ? "Este color ya pertenece a un pedido; ocúltalo en lugar de eliminarlo." : "No fue posible eliminar." }, { status: 409 });
  if (!eliminada) return NextResponse.json({ error: "El stock cambió antes de eliminar. Recarga la página para no perder unidades." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
