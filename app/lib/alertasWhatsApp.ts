import "server-only";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type TipoAlerta = "pago_aprobado" | "pago_rechazado" | "diferencia_pago" | "stock_bajo";

type ResultadoAlerta = {
  configurado: boolean;
  enviado: boolean;
  mensaje: string;
};

function configuracionWhatsApp() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const destinatario = process.env.WHATSAPP_ADMIN_PHONE?.replace(/\D/g, "");
  const plantilla = process.env.WHATSAPP_ADMIN_TEMPLATE_NAME?.trim();
  const idioma = process.env.WHATSAPP_ADMIN_TEMPLATE_LANGUAGE?.trim() || "es_CO";
  const version = process.env.WHATSAPP_API_VERSION?.trim();

  if (!token || !phoneNumberId || !destinatario || !plantilla || !version) return null;
  if (!/^v\d+\.\d+$/.test(version) || !/^\d{8,15}$/.test(destinatario)) return null;

  return { token, phoneNumberId, destinatario, plantilla, idioma, version };
}

export async function enviarAlertaWhatsAppAdmin(
  tipo: TipoAlerta,
  referencia: string,
  titulo: string,
  detalle: string
): Promise<ResultadoAlerta> {
  const config = configuracionWhatsApp();
  if (!config) {
    return { configurado: false, enviado: false, mensaje: "WhatsApp todavía no está configurado." };
  }

  const clave = `${tipo}:${referencia}`.slice(0, 220);
  const { error: errorReserva } = await supabaseAdmin.from("alertas_whatsapp").insert({
    clave,
    tipo,
    referencia: referencia.slice(0, 180),
    destinatario: config.destinatario,
    estado: "procesando",
  });

  if (errorReserva?.code === "23505") {
    return { configurado: true, enviado: false, mensaje: "La alerta ya fue procesada." };
  }
  if (errorReserva) {
    console.error("No fue posible reservar la alerta de WhatsApp", {
      code: errorReserva.code,
      message: errorReserva.message,
      tipo,
      referencia,
    });
    return { configurado: true, enviado: false, mensaje: "No fue posible registrar la alerta." };
  }

  try {
    const respuesta = await fetch(
      `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: config.destinatario,
          type: "template",
          template: {
            name: config.plantilla,
            language: { code: config.idioma },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: titulo.slice(0, 120) },
                  { type: "text", text: detalle.slice(0, 900) },
                ],
              },
            ],
          },
        }),
        cache: "no-store",
      }
    );

    const cuerpo = (await respuesta.json().catch(() => null)) as
      | { messages?: Array<{ id?: string }>; error?: { message?: string } }
      | null;

    if (!respuesta.ok) {
      throw new Error(cuerpo?.error?.message || `Meta respondió ${respuesta.status}.`);
    }

    const messageId = cuerpo?.messages?.[0]?.id || null;
    const { error: errorRegistro } = await supabaseAdmin
      .from("alertas_whatsapp")
      .update({ estado: "enviada", message_id: messageId, enviada_en: new Date().toISOString() })
      .eq("clave", clave);

    if (errorRegistro) {
      console.error("WhatsApp envió la alerta, pero no se actualizó su registro", {
        code: errorRegistro.code,
        message: errorRegistro.message,
        clave,
      });
    }

    return { configurado: true, enviado: true, mensaje: "Alerta enviada por WhatsApp." };
  } catch (error) {
    await supabaseAdmin.from("alertas_whatsapp").delete().eq("clave", clave).eq("estado", "procesando");
    console.error("Error enviando alerta de WhatsApp", {
      tipo,
      referencia,
      error: error instanceof Error ? error.message : "Error desconocido",
    });
    return { configurado: true, enviado: false, mensaje: "Meta no pudo entregar la alerta." };
  }
}

export async function alertarStockBajoDespuesDePago(pedidoId: string) {
  const [productosRes, variantesRes] = await Promise.all([
    supabaseAdmin
      .from("productos")
      .select("nombre,sku,stock,controla_stock,activo")
      .eq("activo", true)
      .eq("controla_stock", true)
      .lte("stock", 3),
    supabaseAdmin
      .from("variantes_producto")
      .select("nombre,sku,stock,controla_stock,activo,productos(nombre)")
      .eq("activo", true)
      .eq("controla_stock", true)
      .lte("stock", 3),
  ]);

  if (productosRes.error || variantesRes.error) {
    console.error("No fue posible consultar el inventario para WhatsApp", {
      productos: productosRes.error?.message,
      variantes: variantesRes.error?.message,
    });
    return;
  }

  const productos = (productosRes.data || []).map(
    (item) => `${item.nombre} (${item.sku || "sin SKU"}): ${item.stock}`
  );
  const variantes = (variantesRes.data || []).map((item) => {
    const producto = Array.isArray(item.productos) ? item.productos[0] : item.productos;
    const nombreProducto = producto && typeof producto === "object" && "nombre" in producto
      ? String(producto.nombre)
      : "Producto";
    return `${nombreProducto} · ${item.nombre} (${item.sku || "sin SKU"}): ${item.stock}`;
  });
  const bajos = [...productos, ...variantes];

  if (bajos.length === 0) return;

  await enviarAlertaWhatsAppAdmin(
    "stock_bajo",
    pedidoId,
    "Inventario bajo",
    `${bajos.slice(0, 8).join(" | ")}${bajos.length > 8 ? ` | y ${bajos.length - 8} más` : ""}`
  );
}
