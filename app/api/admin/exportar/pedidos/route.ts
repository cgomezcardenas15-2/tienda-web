import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { crearCsv, respuestaCsv } from "@/app/lib/csv";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });

  const { data: pedidos, error } = await supabaseAdmin.from("pedidos").select(
    "id,numero_pedido,creado_en,comprador_nombre,comprador_correo,comprador_telefono,comprador_tipo_documento,comprador_numero_documento,entrega_departamento,entrega_ciudad,entrega_direccion,subtotal,costo_envio,descuento,total,moneda,estado_pago,estado_pedido,proveedor_pago,envio_transportadora,envio_servicio,envio_numero_guia,envio_url_seguimiento"
  ).order("creado_en", { ascending: false }).limit(5000);
  if (error) {
    console.error("Error exportando pedidos:", error.message);
    return NextResponse.json({ error: "No fue posible exportar los pedidos." }, { status: 500 });
  }

  const ids = (pedidos ?? []).map((pedido) => pedido.id);
  const { data: lineas, error: errorLineas } = ids.length
    ? await supabaseAdmin.from("productos_pedido").select("pedido_id,nombre,variante_nombre,cantidad,precio_unitario").in("pedido_id", ids)
    : { data: [], error: null };
  if (errorLineas) {
    console.error("Error exportando líneas de pedidos:", errorLineas.message);
    return NextResponse.json({ error: "No fue posible exportar el detalle de los pedidos." }, { status: 500 });
  }

  const productosPorPedido = new Map<string, string[]>();
  for (const linea of lineas ?? []) {
    const lista = productosPorPedido.get(linea.pedido_id) ?? [];
    lista.push(`${linea.nombre}${linea.variante_nombre ? ` (${linea.variante_nombre})` : ""} x${linea.cantidad} @ ${linea.precio_unitario}`);
    productosPorPedido.set(linea.pedido_id, lista);
  }

  const encabezados = ["Pedido","Fecha","Cliente","Correo","Teléfono","Tipo documento","Documento","Departamento","Ciudad","Dirección","Productos","Subtotal","Envío","Descuento","Total","Moneda","Estado pago","Estado pedido","Proveedor","Transportadora","Servicio","Guía","Seguimiento"];
  const filas = (pedidos ?? []).map((pedido) => [
    pedido.numero_pedido, pedido.creado_en, pedido.comprador_nombre, pedido.comprador_correo,
    pedido.comprador_telefono, pedido.comprador_tipo_documento, pedido.comprador_numero_documento,
    pedido.entrega_departamento, pedido.entrega_ciudad, pedido.entrega_direccion,
    (productosPorPedido.get(pedido.id) ?? []).join(" | "), pedido.subtotal, pedido.costo_envio,
    pedido.descuento, pedido.total, pedido.moneda, pedido.estado_pago, pedido.estado_pedido,
    pedido.proveedor_pago, pedido.envio_transportadora, pedido.envio_servicio,
    pedido.envio_numero_guia, pedido.envio_url_seguimiento,
  ]);
  return respuestaCsv(crearCsv(encabezados, filas), `nova-pedidos-${new Date().toISOString().slice(0, 10)}.csv`);
}
