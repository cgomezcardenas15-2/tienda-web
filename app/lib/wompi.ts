import "server-only";

import { createHash } from "node:crypto";

export const WOMPI_API_URL = "https://sandbox.wompi.co/v1";
export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export function obtenerConfiguracionWompi() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  if (!publicKey?.startsWith("pub_test_")) {
    throw new Error("WOMPI_PUBLIC_KEY debe ser una llave Sandbox pub_test_.");
  }

  if (!integritySecret) {
    throw new Error("Falta WOMPI_INTEGRITY_SECRET.");
  }

  return { publicKey, integritySecret };
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
  const { publicKey } = obtenerConfiguracionWompi();
  const respuesta = await fetch(
    `${WOMPI_API_URL}/transactions/${encodeURIComponent(id)}`,
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
