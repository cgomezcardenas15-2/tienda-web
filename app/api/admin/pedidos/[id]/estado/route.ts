import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const TRANSICIONES: Record<string, string> = {
  pagado: "preparando",
  preparando: "enviado",
  enviado: "entregado",
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { estado?: unknown } | null;
  const estadoSolicitado = typeof body?.estado === "string" ? body.estado : "";

  const { data: pedido, error: consultaError } = await supabaseAdmin
    .from("pedidos")
    .select("id,estado_pedido,estado_pago,envio_transportadora,envio_numero_guia")
    .eq("id", id)
    .maybeSingle();

  if (consultaError) {
    console.error("Error consultando pedido para actualizar estado:", { code: consultaError.code, message: consultaError.message });
    return NextResponse.json({ error: "No fue posible consultar el pedido." }, { status: 500 });
  }
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (pedido.estado_pago !== "aprobado") {
    return NextResponse.json({ error: "Solo los pedidos con pago aprobado pueden avanzar." }, { status: 409 });
  }

  const siguientePermitido = TRANSICIONES[pedido.estado_pedido];
  if (!siguientePermitido || estadoSolicitado !== siguientePermitido) {
    return NextResponse.json({ error: "Ese cambio de estado no está permitido." }, { status: 409 });
  }
  if (estadoSolicitado === "enviado" && (!pedido.envio_transportadora || !pedido.envio_numero_guia)) {
    return NextResponse.json({ error: "Guarda primero la transportadora y el número de guía." }, { status: 409 });
  }

  const { data: actualizado, error: actualizacionError } = await supabaseAdmin
    .from("pedidos")
    .update({ estado_pedido: estadoSolicitado })
    .eq("id", id)
    .eq("estado_pedido", pedido.estado_pedido)
    .select("id,estado_pedido")
    .maybeSingle();

  if (actualizacionError) {
    console.error("Error actualizando estado operativo del pedido:", { code: actualizacionError.code, message: actualizacionError.message });
    return NextResponse.json({ error: "No fue posible actualizar el estado del pedido." }, { status: 500 });
  }
  if (!actualizado) {
    return NextResponse.json({ error: "El pedido cambió mientras lo estabas revisando. Actualiza la página." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, estado: actualizado.estado_pedido });
}
