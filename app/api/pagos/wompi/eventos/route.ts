import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { verificarYActualizarPagoWompi } from "@/app/lib/verificarPagoWompi";

type EventoWompi = {
  event?: unknown;
  environment?: unknown;
  timestamp?: unknown;
  data?: unknown;
  signature?: {
    properties?: unknown;
    checksum?: unknown;
  };
};

function responderError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function obtenerValorPropiedad(data: unknown, ruta: string) {
  if (!ruta || ruta.length > 200) return null;

  let valor: unknown = data;
  for (const segmento of ruta.split(".")) {
    if (
      !segmento ||
      !valor ||
      typeof valor !== "object" ||
      Array.isArray(valor) ||
      !Object.prototype.hasOwnProperty.call(valor, segmento)
    ) {
      return null;
    }
    valor = (valor as Record<string, unknown>)[segmento];
  }

  return typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean"
    ? String(valor)
    : null;
}

function coincidenFirmas(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a.toLowerCase(), "hex"), Buffer.from(b.toLowerCase(), "hex"));
}

export async function POST(request: Request) {
  let evento: EventoWompi;

  try {
    evento = (await request.json()) as EventoWompi;
  } catch {
    return responderError("El evento no contiene JSON válido.", 400);
  }

  if (evento.event !== "transaction.updated") {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  if (evento.environment !== "test") {
    return responderError("El evento no pertenece al ambiente Sandbox.", 400);
  }

  const secreto = process.env.WOMPI_EVENTS_SECRET;
  const propiedades = evento.signature?.properties;
  const checksum = evento.signature?.checksum;

  if (!secreto?.startsWith("test_events_")) {
    console.error("Falta la configuración Sandbox de eventos Wompi.");
    return responderError("El servidor no puede validar el evento.", 500);
  }

  if (
    !Array.isArray(propiedades) ||
    propiedades.length === 0 ||
    propiedades.length > 20 ||
    !propiedades.every((propiedad) => typeof propiedad === "string") ||
    typeof evento.timestamp !== "number" ||
    !Number.isSafeInteger(evento.timestamp) ||
    typeof checksum !== "string"
  ) {
    return responderError("La firma del evento es inválida.", 401);
  }

  const valores = propiedades.map((propiedad) =>
    obtenerValorPropiedad(evento.data, propiedad)
  );

  if (valores.some((valor) => valor === null)) {
    return responderError("La firma del evento es inválida.", 401);
  }

  const firmaCalculada = createHash("sha256")
    .update(`${valores.join("")}${evento.timestamp}${secreto}`, "utf8")
    .digest("hex");
  const checksumCabecera = request.headers.get("x-event-checksum");

  if (
    !coincidenFirmas(firmaCalculada, checksum) ||
    (checksumCabecera && !coincidenFirmas(firmaCalculada, checksumCabecera))
  ) {
    return responderError("La firma del evento es inválida.", 401);
  }

  const transaccion =
    evento.data && typeof evento.data === "object" && !Array.isArray(evento.data)
      ? (evento.data as Record<string, unknown>).transaction
      : null;
  const idTransaccion =
    transaccion && typeof transaccion === "object" && !Array.isArray(transaccion)
      ? (transaccion as Record<string, unknown>).id
      : null;

  if (typeof idTransaccion !== "string" || !idTransaccion.trim() || idTransaccion.length > 160) {
    return responderError("El evento no contiene una transacción válida.", 400);
  }

  try {
    const resultado = await verificarYActualizarPagoWompi(idTransaccion.trim());
    console.info("Evento Wompi procesado", {
      transactionId: idTransaccion,
      pedidoId: resultado.pedidoId,
      estado: resultado.estado,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando evento Wompi", {
      transactionId: idTransaccion,
      error: error instanceof Error ? error.message : "Error desconocido",
    });
    return responderError("No fue posible procesar el evento.", 500);
  }
}
