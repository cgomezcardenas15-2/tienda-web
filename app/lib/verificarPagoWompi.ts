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

export async function verificarYActualizarPagoWompi(idTransaccion: string) {
  const transaccion = await consultarTransaccionWompi(idTransaccion);
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,total,moneda,estado_pago,referencia_pago")
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

  const { error: errorActualizacion } = await supabaseAdmin
    .from("pedidos")
    .update(nuevoEstado)
    .eq("id", data.id)
    .eq("referencia_pago", transaccion.reference);

  if (errorActualizacion) {
    throw errorActualizacion;
  }

  return {
    pedidoId: data.id,
    estado: transaccion.status,
    aprobado: transaccion.status === "APPROVED",
    mensaje: transaccion.status_message || null,
  };
}
