import "server-only";

import { createHash } from "node:crypto";

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export type AmbienteWompi = "sandbox" | "production";

export function obtenerAmbienteWompi(): AmbienteWompi {
  const ambiente = process.env.WOMPI_ENVIRONMENT?.trim().toLowerCase() || "sandbox";

  if (ambiente !== "sandbox" && ambiente !== "production") {
    throw new Error("WOMPI_ENVIRONMENT debe ser sandbox o production.");
  }

  return ambiente;
}

export function obtenerConfiguracionWompi() {
  const ambiente = obtenerAmbienteWompi();
  const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET?.trim();
  const esProduccion = ambiente === "production";
  const prefijoLlavePublica = esProduccion ? "pub_prod_" : "pub_test_";
  const prefijoIntegridad = esProduccion ? "prod_integrity_" : "test_integrity_";

  if (!publicKey?.startsWith(prefijoLlavePublica)) {
    throw new Error(`WOMPI_PUBLIC_KEY no corresponde al ambiente ${ambiente}.`);
  }

  if (!integritySecret?.startsWith(prefijoIntegridad)) {
    throw new Error(`WOMPI_INTEGRITY_SECRET no corresponde al ambiente ${ambiente}.`);
  }

  return {
    ambiente,
    apiUrl: esProduccion ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
    eventEnvironment: esProduccion ? "prod" : "test",
    eventsSecretPrefix: esProduccion ? "prod_events_" : "test_events_",
    publicKey,
    integritySecret,
  };
}

export function convertirPesosACentavos(valor: number) {
  const centavos = Math.round(valor * 100);

  if (!Number.isSafeInteger(centavos) || centavos <= 0) {
    throw new Error("El total del pedido no es válido para Wompi.");
  }

  return centavos;
}

export function generarFirmaIntegridad(
  referencia: string,
  montoEnCentavos: number,
  moneda: "COP",
  secreto: string
) {
  return createHash("sha256")
    .update(`${referencia}${montoEnCentavos}${moneda}${secreto}`, "utf8")
    .digest("hex");
}

export type TransaccionWompi = {
  id: string;
  reference: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
  status_message?: string;
};

export async function consultarTransaccionWompi(id: string) {
  const { apiUrl, publicKey } = obtenerConfiguracionWompi();
  const respuesta = await fetch(
    `${apiUrl}/transactions/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${publicKey}` },
      cache: "no-store",
    }
  );

  if (!respuesta.ok) {
    throw new Error(`Wompi respondió con estado ${respuesta.status}.`);
  }

  const contenido = (await respuesta.json()) as { data?: TransaccionWompi };

  if (!contenido.data?.id) {
    throw new Error("Wompi devolvió una transacción inválida.");
  }

  return contenido.data;
}
