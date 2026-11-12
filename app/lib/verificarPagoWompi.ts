import "server-only";

import { after } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { consultarTransaccionWompi, convertirPesosACentavos } from "@/app/lib/wompi";
import { getMetaContentId } from "@/app/lib/metaContentId";
import { sendMetaPurchase } from "@/app/lib/metaConversionsApi";

export class ErrorVerificacionPago extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ErrorVerificacionPago";
  }
}

async function obtenerCompraMeta(pedido: {
  id: string;
  numero_pedido: string;
  total: number;
  moneda: string;
}) {
  const { data: productos, error } = await supabaseAdmin
    .from("productos_pedido")
    .select("producto_id,variante_id,variante_sku,precio_unitario,cantidad")
    .eq("pedido_id", pedido.id);

  if (error || !productos?.length) {
    console.error("No fue posible preparar los datos de compra para Meta", {
      pedidoId: pedido.id,
      error: error?.message,
    });
    return null;
  }

  const contents = productos.map((producto) => ({
    id: getMetaContentId({
      id: producto.producto_id,
      varianteId: producto.variante_id,
      sku: producto.variante_sku,
    }),
    quantity: Number(producto.cantidad),
    item_price: Number(producto.precio_unitario),
  }));

  return {
    pedidoId: pedido.id,
    numeroPedido: pedido.numero_pedido,
    value: Number(pedido.total),
    currency: "COP" as const,
    contentIds: contents.map((producto) => producto.id),
    contents,
    numItems: contents.reduce(
      (total, producto) => total + producto.quantity,
      0
    ),
  };
}

async function enviarCompraMetaServidor(
  pedido: {
    id: string;
    numero_pedido: string;
    comprador_correo: string;
    comprador_telefono: string;
    meta_marketing_consent: boolean;
    meta_fbp: string | null;
    meta_fbc: string | null;
  },
  compraMeta: Awaited<ReturnType<typeof obtenerCompraMeta>>
) {
  if (!compraMeta) return;

  if (pedido.meta_marketing_consent !== true) {
    console.info("Meta CAPI Purchase omitido por consentimiento", {
      pedidoId: pedido.id,
    });
    return;
  }

  const eventId = `purchase:${pedido.id}`;
  const { data: claim, error: claimError } = await supabaseAdmin.rpc(
    "claim_meta_conversion_event",
    {
      p_event_id: eventId,
      p_pedido_id: pedido.id,
    }
  );

  if (claimError) {
    console.error("No fue posible reservar el evento Purchase de Meta", {
      pedidoId: pedido.id,
      code: claimError.code,
    });
    return;
  }

  const claimResult = claim as {
    claimed?: boolean;
    reason?: string;
    attempt?: number;
    event_time?: number;
  } | null;
  if (claimResult?.claimed !== true) {
    console.info("Meta CAPI Purchase no requiere otro envío", {
      pedidoId: pedido.id,
      reason: claimResult?.reason ?? "not_claimed",
    });
    return;
  }

  if (
    !Number.isInteger(claimResult.attempt) ||
    Number(claimResult.attempt) <= 0 ||
    !Number.isInteger(claimResult.event_time) ||
    Number(claimResult.event_time) <= 0
  ) {
    console.error("La reserva del evento Purchase de Meta es inválida", {
      pedidoId: pedido.id,
    });
    return;
  }

  const result = await sendMetaPurchase({
    marketingConsent: true,
    purchase: {
      pedidoId: compraMeta.pedidoId,
      numeroPedido: compraMeta.numeroPedido,
      value: compraMeta.value,
      currency: "COP",
      contents: compraMeta.contents,
      numItems: compraMeta.numItems,
      email: pedido.comprador_correo,
      phone: pedido.comprador_telefono,
      fbp: pedido.meta_fbp,
      fbc: pedido.meta_fbc,
      eventTime: Number(claimResult.event_time),
    },
  });

  const delivered = result.status === "sent";
  const completionError =
    result.status === "error"
      ? result.reason
      : result.status === "skipped_not_configured"
        ? "Meta CAPI no está configurado."
        : result.status === "skipped_no_consent"
          ? "El consentimiento ya no permite el envío."
          : null;
  const completionHttpStatus = result.status === "error" ? result.httpStatus : null;

  const { error: completeError } = await supabaseAdmin.rpc(
    "complete_meta_conversion_event",
    {
      p_event_id: eventId,
      p_attempt: Number(claimResult.attempt),
      p_success: delivered,
      p_http_status: completionHttpStatus,
      p_error: completionError,
    }
  );

  if (completeError) {
    console.error("No fue posible cerrar el estado del evento Purchase de Meta", {
      pedidoId: pedido.id,
      code: completeError.code,
    });
  }

  if (result.status === "error") {
    console.error("Meta CAPI no pudo registrar Purchase", {
      pedidoId: pedido.id,
      httpStatus: result.httpStatus,
      reason: result.reason,
    });
    return;
  }

  console.info("Resultado de Meta CAPI Purchase", {
    pedidoId: pedido.id,
    status: result.status,
    eventsReceived: result.status === "sent" ? result.eventsReceived : 0,
  });
}

function programarCompraMetaServidor(
  pedido: Parameters<typeof enviarCompraMetaServidor>[0],
  compraMeta: Parameters<typeof enviarCompraMetaServidor>[1]
) {
  after(async () => {
    try {
      await enviarCompraMetaServidor(pedido, compraMeta);
    } catch (error) {
      console.error("Error inesperado enviando Purchase a Meta CAPI", {
        pedidoId: pedido.id,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  });
}

export async function verificarYActualizarPagoWompi(idTransaccion: string) {
  const transaccion = await consultarTransaccionWompi(idTransaccion);
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select(
      "id,numero_pedido,total,moneda,estado_pago,referencia_pago,comprador_correo,comprador_telefono,meta_marketing_consent,meta_fbp,meta_fbc"
    )
    .eq("referencia_pago", transaccion.reference)
    .single();

  if (error || !data) {
    throw new ErrorVerificacionPago("La transacción no corresponde a un pedido.", 404);
  }

  const montoEsperado = convertirPesosACentavos(Number(data.total));
  const coincide =
    transaccion.reference === data.referencia_pago &&
    transaccion.amount_in_cents === montoEsperado &&
    transaccion.currency === data.moneda &&
    transaccion.currency === "COP";

  if (!coincide) {
    console.error("Transacción Wompi no coincide con el pedido", {
      transactionId: transaccion.id,
      reference: transaccion.reference,
      pedidoId: data.id,
    });
    throw new ErrorVerificacionPago("Los datos del pago no coinciden con el pedido.", 409);
  }

  // Un evento atrasado o un segundo intento de pago nunca debe devolver un
  // pedido ya aprobado a "pendiente", ni volver a consumir inventario.
  if (data.estado_pago === "aprobado") {
    // Un pedido puede tener intentos anteriores o posteriores con la misma
    // referencia. Solo la transacción que Wompi confirma como APPROVED puede
    // producir el evento Purchase.
    if (transaccion.status !== "APPROVED") {
      return {
        pedidoId: data.id,
        numeroPedido: data.numero_pedido,
        estado: transaccion.status,
        aprobado: false,
        duplicado: false,
        mensaje:
          transaccion.status_message ||
          "Esta transacción no fue aprobada; el pedido ya registra otro pago aprobado.",
        compraMeta: null,
      };
    }

    const compraMeta = await obtenerCompraMeta(data);
    programarCompraMetaServidor(data, compraMeta);
    return {
      pedidoId: data.id,
      numeroPedido: data.numero_pedido,
      estado: "APPROVED" as const,
      aprobado: true,
      duplicado: true,
      mensaje: null,
      compraMeta,
    };
  }

  const estados = {
    APPROVED: { estado_pago: "aprobado", estado_pedido: "pagado" },
    PENDING: { estado_pago: "procesando", estado_pedido: "pendiente_pago" },
    DECLINED: { estado_pago: "rechazado", estado_pedido: "pendiente_pago" },
    VOIDED: { estado_pago: "cancelado", estado_pedido: "cancelado" },
    ERROR: { estado_pago: "rechazado", estado_pedido: "pendiente_pago" },
  } as const;

  const nuevoEstado = estados[transaccion.status];

  if (!nuevoEstado) {
    throw new ErrorVerificacionPago("Wompi devolvió un estado desconocido.", 502);
  }

  if (transaccion.status === "APPROVED") {
    const { data: confirmacion, error: errorConfirmacion } = await supabaseAdmin.rpc(
      "confirmar_pago_wompi",
      {
        p_pedido_id: data.id,
        p_transaccion_id: transaccion.id,
        p_referencia_pedido: transaccion.reference,
        p_monto_centavos: transaccion.amount_in_cents,
        p_moneda: transaccion.currency,
      }
    );

    if (errorConfirmacion) {
      const codigo =
        typeof errorConfirmacion.code === "string"
          ? errorConfirmacion.code
          : "SUPABASE";
      const mensaje =
        typeof errorConfirmacion.message === "string"
          ? errorConfirmacion.message
          : "No fue posible confirmar el pago en Supabase.";

      throw new Error(`[${codigo}] ${mensaje}`);
    }

    const resultadoConfirmacion = confirmacion as {
      procesado?: boolean;
      duplicado?: boolean;
    } | null;

    const compraMeta = await obtenerCompraMeta(data);
    programarCompraMetaServidor(data, compraMeta);

    return {
      pedidoId: data.id,
      numeroPedido: data.numero_pedido,
      estado: transaccion.status,
      aprobado: true,
      duplicado: resultadoConfirmacion?.duplicado === true,
      mensaje: transaccion.status_message || null,
      compraMeta,
    };
  } else {
    const { error: errorActualizacion } = await supabaseAdmin
      .from("pedidos")
      .update(nuevoEstado)
      .eq("id", data.id)
      .eq("referencia_pago", transaccion.reference)
      .neq("estado_pago", "aprobado");

    if (errorActualizacion) {
      throw errorActualizacion;
    }

    if (["DECLINED", "VOIDED", "ERROR"].includes(transaccion.status)) {
      const { error: errorLiberacion } = await supabaseAdmin.rpc("liberar_reserva_pedido", {
        p_pedido_id: data.id,
        p_estado_final: "liberada",
      });
      if (errorLiberacion) throw errorLiberacion;
    }
  }

  return {
    pedidoId: data.id,
    numeroPedido: data.numero_pedido,
    estado: transaccion.status,
    aprobado: false,
    duplicado: false,
    mensaje: transaccion.status_message || null,
  };
}
