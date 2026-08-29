import "server-only";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type PedidoEnvio = {
  id: string;
  comprador_nombre: string;
  comprador_correo: string;
  envio_transportadora: string | null;
  envio_servicio: string | null;
  envio_numero_guia: string | null;
  envio_url_seguimiento: string | null;
  envio_notificado_email_en: string | null;
};

export type ResultadoNotificacion = {
  ok: boolean;
  enviado: boolean;
  mensaje: string;
};

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configuracionCorreo() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const remitente = process.env.EMAIL_FROM?.trim();
  const respuesta = process.env.EMAIL_REPLY_TO?.trim();

  if (!apiKey || !remitente) return null;
  return { apiKey, remitente, respuesta };
}

export async function notificarEnvioPorCorreo(pedido: PedidoEnvio): Promise<ResultadoNotificacion> {
  if (pedido.envio_notificado_email_en) {
    return { ok: true, enviado: false, mensaje: "El correo de envío ya había sido enviado." };
  }

  if (!pedido.comprador_correo || !pedido.envio_transportadora || !pedido.envio_numero_guia) {
    return { ok: false, enviado: false, mensaje: "Faltan el correo del cliente o los datos obligatorios de la guía." };
  }

  const config = configuracionCorreo();
  if (!config) {
    return { ok: false, enviado: false, mensaje: "El pedido avanzó, pero el servicio de correo todavía no está configurado." };
  }

  const nombre = escaparHtml(pedido.comprador_nombre || "cliente");
  const transportadora = escaparHtml(pedido.envio_transportadora);
  const guia = escaparHtml(pedido.envio_numero_guia);
  const servicio = pedido.envio_servicio ? escaparHtml(pedido.envio_servicio) : "Envío nacional";
  const seguimiento = pedido.envio_url_seguimiento
    ? `<p style="margin:28px 0"><a href="${escaparHtml(pedido.envio_url_seguimiento)}" style="background:#84f000;color:#071000;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:800">Seguir mi pedido</a></p>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#070a07;color:#f5f5f5;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:36px 22px"><p style="color:#84f000;font-weight:900;letter-spacing:3px">NOVA</p><div style="background:#111411;border:1px solid #2b302b;border-radius:18px;padding:28px"><h1 style="margin-top:0">Tu pedido ya fue enviado</h1><p>Hola ${nombre}, tu compra ya fue entregada a la transportadora.</p><div style="margin:24px 0;padding:18px;background:#090b09;border-radius:12px"><p><strong>Transportadora:</strong> ${transportadora}</p><p><strong>Servicio:</strong> ${servicio}</p><p><strong>Número de guía:</strong> ${guia}</p></div>${seguimiento}<p style="color:#a1a1aa;font-size:14px">Conserva este correo para consultar la información de tu envío.</p></div></div></body></html>`;

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `nova-envio/${pedido.id}/${pedido.envio_numero_guia}`.slice(0, 256),
    },
    body: JSON.stringify({
      from: config.remitente,
      to: [pedido.comprador_correo],
      subject: `Tu pedido NOVA ya fue enviado · Guía ${pedido.envio_numero_guia}`,
      html,
      ...(config.respuesta ? { reply_to: config.respuesta } : {}),
    }),
    cache: "no-store",
  });

  if (!respuesta.ok) {
    const detalle = (await respuesta.json().catch(() => null)) as { message?: string } | null;
    console.error("Error enviando correo de guía:", { status: respuesta.status, message: detalle?.message || "Sin detalle" });
    return { ok: false, enviado: false, mensaje: "No fue posible enviar el correo. Puedes reintentarlo desde el pedido." };
  }

  const { error } = await supabaseAdmin
    .from("pedidos")
    .update({ envio_notificado_email_en: new Date().toISOString() })
    .eq("id", pedido.id)
    .is("envio_notificado_email_en", null);

  if (error) {
    console.error("Correo enviado, pero no se registró la notificación:", { code: error.code, message: error.message });
    return { ok: true, enviado: true, mensaje: "Correo enviado. No fue posible registrar la fecha de notificación." };
  }

  return { ok: true, enviado: true, mensaje: "Correo de envío enviado al cliente." };
}
