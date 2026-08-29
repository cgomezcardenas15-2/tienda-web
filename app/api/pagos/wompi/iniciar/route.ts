import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { crearCheckoutWompi, type PedidoParaPago } from "@/app/lib/iniciarPagoPedido";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pedidoId?: unknown };
    const pedidoId = typeof body.pedidoId === "string" ? body.pedidoId.trim() : "";

    if (!pedidoId) {
      return NextResponse.json({ ok: false, error: "Falta el pedido." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select(
        "id,numero_pedido,total,moneda,estado_pago,referencia_pago,comprador_nombre,comprador_correo,comprador_telefono,comprador_tipo_documento,comprador_numero_documento"
      )
      .eq("id", pedidoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "No encontramos el pedido." }, { status: 404 });
    }

    const pedido = data as PedidoParaPago;

    const checkoutUrl = await crearCheckoutWompi(pedido, request.url);
    return NextResponse.json({ ok: true, checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "PAGO_APROBADO") {
      return NextResponse.json({ ok: false, error: "Este pedido ya está pagado." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "MONEDA_INVALIDA") {
      return NextResponse.json({ ok: false, error: "La moneda del pedido no es válida." }, { status: 409 });
    }
    console.error("Error iniciando pago Wompi:", error);
    return NextResponse.json(
      { ok: false, error: "No fue posible iniciar el pago con Wompi." },
      { status: 500 }
    );
  }
}
