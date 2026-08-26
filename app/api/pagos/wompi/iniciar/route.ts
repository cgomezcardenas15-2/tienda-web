import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import {
  WOMPI_CHECKOUT_URL,
  convertirPesosACentavos,
  generarFirmaIntegridad,
  obtenerConfiguracionWompi,
} from "@/app/lib/wompi";

type PedidoPago = {
  id: string;
  total: number;
  moneda: string;
  estado_pago: string;
  referencia_pago: string | null;
  comprador_nombre: string;
  comprador_correo: string;
  comprador_telefono: string;
  comprador_tipo_documento: string;
  comprador_numero_documento: string;
};

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
        "id,total,moneda,estado_pago,referencia_pago,comprador_nombre,comprador_correo,comprador_telefono,comprador_tipo_documento,comprador_numero_documento"
      )
      .eq("id", pedidoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "No encontramos el pedido." }, { status: 404 });
    }

    const pedido = data as PedidoPago;

    if (pedido.estado_pago === "pagado") {
      return NextResponse.json({ ok: false, error: "Este pedido ya está pagado." }, { status: 409 });
    }

    if (pedido.moneda !== "COP") {
      return NextResponse.json({ ok: false, error: "La moneda del pedido no es válida." }, { status: 409 });
    }

    const referencia = pedido.referencia_pago || `NOVA-${pedido.id}`;
    const montoEnCentavos = convertirPesosACentavos(Number(pedido.total));
    const { publicKey, integritySecret } = obtenerConfiguracionWompi();
    const firma = generarFirmaIntegridad(referencia, montoEnCentavos, "COP", integritySecret);

    const { error: errorActualizacion } = await supabaseAdmin
      .from("pedidos")
      .update({
        proveedor_pago: "wompi",
        referencia_pago: referencia,
        estado_pago: "pendiente",
      })
      .eq("id", pedido.id)
      .neq("estado_pago", "pagado");

    if (errorActualizacion) {
      throw errorActualizacion;
    }

    const redirectUrl = new URL("/pago/resultado", request.url).toString();
    const checkout = new URL(WOMPI_CHECKOUT_URL);
    checkout.searchParams.set("public-key", publicKey);
    checkout.searchParams.set("currency", "COP");
    checkout.searchParams.set("amount-in-cents", String(montoEnCentavos));
    checkout.searchParams.set("reference", referencia);
    checkout.searchParams.set("signature:integrity", firma);
    checkout.searchParams.set("redirect-url", redirectUrl);
    checkout.searchParams.set("customer-data:email", pedido.comprador_correo);
    checkout.searchParams.set("customer-data:full-name", pedido.comprador_nombre);
    checkout.searchParams.set("customer-data:phone-number", pedido.comprador_telefono);
    checkout.searchParams.set("customer-data:legal-id", pedido.comprador_numero_documento);
    checkout.searchParams.set("customer-data:legal-id-type", pedido.comprador_tipo_documento);

    return NextResponse.json({ ok: true, checkoutUrl: checkout.toString() });
  } catch (error) {
    console.error("Error iniciando pago Wompi:", error);
    return NextResponse.json(
      { ok: false, error: "No fue posible iniciar el pago con Wompi." },
      { status: 500 }
    );
  }
}
