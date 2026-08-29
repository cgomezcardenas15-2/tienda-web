import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { notificarEnvioPorCorreo } from "@/app/lib/notificacionesPedido";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const { id } = await params;
  const { data: pedido, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,comprador_nombre,comprador_correo,estado_pedido,envio_transportadora,envio_servicio,envio_numero_guia,envio_url_seguimiento,envio_notificado_email_en")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error consultando pedido para notificar envío:", { code: error.code, message: error.message });
    return NextResponse.json({ error: "No fue posible consultar el pedido." }, { status: 500 });
  }
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (!["enviado", "entregado"].includes(pedido.estado_pedido)) {
    return NextResponse.json({ error: "El correo de guía solo se envía cuando el pedido ya está enviado." }, { status: 409 });
  }

  const resultado = await notificarEnvioPorCorreo(pedido);
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 });
}
