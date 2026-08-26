import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { consultarTransaccionWompi, convertirPesosACentavos } from "@/app/lib/wompi";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();

    if (!id || id.length > 160) {
      return NextResponse.json({ ok: false, error: "La transacción no es válida." }, { status: 400 });
    }

    const transaccion = await consultarTransaccionWompi(id);
    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select("id,total,moneda,estado_pago,referencia_pago")
      .eq("referencia_pago", transaccion.reference)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "La transacción no corresponde a un pedido." }, { status: 404 });
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
      return NextResponse.json({ ok: false, error: "Los datos del pago no coinciden con el pedido." }, { status: 409 });
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
      return NextResponse.json({ ok: false, error: "Wompi devolvió un estado desconocido." }, { status: 502 });
    }

    const { error: errorActualizacion } = await supabaseAdmin
      .from("pedidos")
      .update(nuevoEstado)
      .eq("id", data.id)
      .eq("referencia_pago", transaccion.reference);

    if (errorActualizacion) {
      throw errorActualizacion;
    }

    return NextResponse.json({
      ok: true,
      pedidoId: data.id,
      estado: transaccion.status,
      aprobado: transaccion.status === "APPROVED",
      mensaje: transaccion.status_message || null,
    });
  } catch (error) {
    console.error("Error verificando pago Wompi:", error);
    return NextResponse.json(
      { ok: false, error: "No fue posible verificar el pago con Wompi." },
      { status: 502 }
    );
  }
}
