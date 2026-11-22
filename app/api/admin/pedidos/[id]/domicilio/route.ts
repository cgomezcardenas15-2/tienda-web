import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const VALOR_MAXIMO_DOMICILIO = 10_000_000;

function esDomicilioPorPagar(pedido: {
  envio_zona?: unknown;
  envio_mensaje?: unknown;
  costo_envio?: unknown;
}) {
  if (String(pedido.envio_zona || "").trim().toUpperCase() !== "CALI") return false;
  if (Number(pedido.costo_envio || 0) !== 0) return false;

  const mensaje = typeof pedido.envio_mensaje === "string"
    ? pedido.envio_mensaje.toLocaleLowerCase("es-CO")
    : "";
  return mensaje.includes("recib") && (mensaje.includes("paga") || mensaje.includes("pago"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    valorConfirmado?: unknown;
    pagoRecibido?: unknown;
  } | null;
  if (!body || typeof body.pagoRecibido !== "boolean") {
    return NextResponse.json({ error: "Los datos del domicilio no son válidos." }, { status: 400 });
  }

  const valorConfirmado = body.valorConfirmado === null
    ? null
    : typeof body.valorConfirmado === "number"
      ? body.valorConfirmado
      : Number.NaN;
  if (
    valorConfirmado !== null
    && (
      !Number.isSafeInteger(valorConfirmado)
      || valorConfirmado <= 0
      || valorConfirmado > VALOR_MAXIMO_DOMICILIO
    )
  ) {
    return NextResponse.json(
      { error: "El valor del domicilio debe ser un número entero mayor que cero." },
      { status: 400 },
    );
  }
  if (body.pagoRecibido && valorConfirmado === null) {
    return NextResponse.json(
      { error: "Primero confirma el valor del domicilio." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { data: pedido, error: consultaError } = await supabaseAdmin
    .from("pedidos")
    .select("id,estado_pedido,envio_zona,envio_mensaje,costo_envio,envio_valor_confirmado,envio_pago_recibido,envio_valor_confirmado_en,envio_pago_recibido_en")
    .eq("id", id)
    .maybeSingle();

  if (consultaError) {
    console.error("Error consultando el domicilio del pedido:", {
      code: consultaError.code,
      message: consultaError.message,
    });
    const mensaje = consultaError.code === "42703"
      ? "Primero debe activarse el módulo de control de domicilios."
      : "No fue posible consultar el domicilio.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (!esDomicilioPorPagar(pedido)) {
    return NextResponse.json(
      { error: "Este pedido no corresponde a un domicilio local de Cali por pagar." },
      { status: 409 },
    );
  }
  if (pedido.estado_pedido === "cancelado") {
    return NextResponse.json(
      { error: "No puedes modificar el domicilio de un pedido cancelado." },
      { status: 409 },
    );
  }

  const valorActual = pedido.envio_valor_confirmado === null
    ? null
    : Number(pedido.envio_valor_confirmado);
  const pagoActual = pedido.envio_pago_recibido === true;

  if (pagoActual) {
    const sinCambios = body.pagoRecibido === true && valorActual === valorConfirmado;
    if (!sinCambios) {
      return NextResponse.json(
        { error: "El domicilio ya fue cobrado y su registro no puede modificarse." },
        { status: 409 },
      );
    }
    return NextResponse.json({
      ok: true,
      domicilio: {
        valorConfirmado: valorActual,
        pagoRecibido: true,
        valorConfirmadoEn: pedido.envio_valor_confirmado_en,
        pagoRecibidoEn: pedido.envio_pago_recibido_en,
      },
    });
  }

  if (body.pagoRecibido && pedido.estado_pedido !== "entregado") {
    return NextResponse.json(
      { error: "Marca primero el pedido como entregado antes de registrar el cobro del domicilio." },
      { status: 409 },
    );
  }

  const ahora = new Date().toISOString();
  const actualizacion = {
    envio_valor_confirmado: valorConfirmado,
    envio_valor_confirmado_en: valorConfirmado === null
      ? null
      : valorActual === valorConfirmado && pedido.envio_valor_confirmado_en
        ? pedido.envio_valor_confirmado_en
        : ahora,
    envio_pago_recibido: body.pagoRecibido,
    envio_pago_recibido_en: body.pagoRecibido ? ahora : null,
  };

  let actualizacionPedido = supabaseAdmin
    .from("pedidos")
    .update(actualizacion)
    .eq("id", id)
    .eq("estado_pedido", pedido.estado_pedido)
    .eq("envio_pago_recibido", false);
  if (valorActual === null) {
    actualizacionPedido = actualizacionPedido.is("envio_valor_confirmado", null);
  } else {
    actualizacionPedido = actualizacionPedido.eq("envio_valor_confirmado", valorActual);
  }

  const { data: guardado, error: actualizacionError } = await actualizacionPedido
    .select("envio_valor_confirmado,envio_pago_recibido,envio_valor_confirmado_en,envio_pago_recibido_en")
    .maybeSingle();

  if (actualizacionError) {
    console.error("Error guardando el domicilio del pedido:", {
      code: actualizacionError.code,
      message: actualizacionError.message,
    });
    return NextResponse.json({ error: "No fue posible guardar el domicilio." }, { status: 500 });
  }
  if (!guardado) {
    return NextResponse.json(
      { error: "El domicilio cambió mientras lo editabas. Actualiza la página e inténtalo nuevamente." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    domicilio: {
      valorConfirmado: guardado.envio_valor_confirmado === null
        ? null
        : Number(guardado.envio_valor_confirmado),
      pagoRecibido: guardado.envio_pago_recibido === true,
      valorConfirmadoEn: guardado.envio_valor_confirmado_en,
      pagoRecibidoEn: guardado.envio_pago_recibido_en,
    },
  });
}
