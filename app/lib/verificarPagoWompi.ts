import "server-only";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { consultarTransaccionWompi, convertirPesosACentavos } from "@/app/lib/wompi";

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
    id:
      producto.variante_sku?.trim() ||
      producto.variante_id ||
      producto.producto_id,
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

export async function verificarYActualizarPagoWompi(idTransaccion: string) {
  const transaccion = await consultarTransaccionWompi(idTransaccion);
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,numero_pedido,total,moneda,estado_pago,referencia_pago")
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
    const compraMeta = await obtenerCompraMeta(data);
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
