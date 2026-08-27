import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function texto(body: Record<string, unknown>, campo: string, maximo: number) {
  const valor = typeof body[campo] === "string" ? body[campo].trim() : "";
  return valor.length <= maximo ? valor : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Los datos no son válidos." }, { status: 400 });

  const transportadora = texto(body, "transportadora", 80);
  const servicio = texto(body, "servicio", 80);
  const numeroGuia = texto(body, "numeroGuia", 120);
  const urlSeguimiento = texto(body, "urlSeguimiento", 500);
  if (transportadora === null || servicio === null || numeroGuia === null || urlSeguimiento === null) {
    return NextResponse.json({ error: "Uno de los campos supera el tamaño permitido." }, { status: 400 });
  }
  if (!transportadora || !numeroGuia) {
    return NextResponse.json({ error: "La transportadora y el número de guía son obligatorios." }, { status: 400 });
  }
  if (urlSeguimiento) {
    try {
      if (new URL(urlSeguimiento).protocol !== "https:") throw new Error();
    } catch {
      return NextResponse.json({ error: "El enlace de seguimiento debe ser una dirección segura que comience por https://" }, { status: 400 });
    }
  }

  const { id } = await params;
  const { data: pedido, error: consultaError } = await supabaseAdmin.from("pedidos").select("id,estado_pago,estado_pedido").eq("id", id).maybeSingle();
  if (consultaError) {
    console.error("Error consultando pedido para guardar envío:", { code: consultaError.code, message: consultaError.message });
    return NextResponse.json({ error: "No fue posible consultar el pedido." }, { status: 500 });
  }
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (pedido.estado_pago !== "aprobado" || !["preparando", "enviado"].includes(pedido.estado_pedido)) {
    return NextResponse.json({ error: "La información de envío no puede modificarse en el estado actual." }, { status: 409 });
  }

  const { error: actualizacionError } = await supabaseAdmin.from("pedidos").update({
    envio_transportadora: transportadora,
    envio_servicio: servicio || null,
    envio_numero_guia: numeroGuia,
    envio_url_seguimiento: urlSeguimiento || null,
  }).eq("id", id);

  if (actualizacionError) {
    console.error("Error guardando información de envío:", { code: actualizacionError.code, message: actualizacionError.message });
    return NextResponse.json({ error: "No fue posible guardar la información de envío." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
