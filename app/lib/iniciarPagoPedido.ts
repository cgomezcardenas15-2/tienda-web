import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import {
  WOMPI_CHECKOUT_URL,
  convertirPesosACentavos,
  generarFirmaIntegridad,
  obtenerConfiguracionWompi,
} from "@/app/lib/wompi";

export type PedidoParaPago = {
  id: string; numero_pedido: string; total: number; moneda: string; estado_pago: string;
  referencia_pago: string | null; comprador_nombre: string; comprador_correo: string;
  comprador_telefono: string; comprador_tipo_documento: string; comprador_numero_documento: string;
};

export async function crearCheckoutWompi(pedido: PedidoParaPago, requestUrl: string) {
  if (pedido.estado_pago === "aprobado") throw new Error("PAGO_APROBADO");
  if (pedido.moneda !== "COP") throw new Error("MONEDA_INVALIDA");

  const referencia = pedido.referencia_pago || pedido.numero_pedido;
  const montoEnCentavos = convertirPesosACentavos(Number(pedido.total));
  const { publicKey, integritySecret } = obtenerConfiguracionWompi();
  const firma = generarFirmaIntegridad(referencia, montoEnCentavos, "COP", integritySecret);
  const { error } = await supabaseAdmin.from("pedidos").update({
    proveedor_pago: "wompi", referencia_pago: referencia, estado_pago: "pendiente",
  }).eq("id", pedido.id).neq("estado_pago", "aprobado");
  if (error) throw error;

  const urlPeticion = new URL(requestUrl);
  const local = urlPeticion.hostname === "localhost" || urlPeticion.hostname === "127.0.0.1";
  const origen = local ? "https://tienda-web-red.vercel.app" : urlPeticion.origin;
  const checkout = new URL(WOMPI_CHECKOUT_URL);
  checkout.searchParams.set("public-key", publicKey);
  checkout.searchParams.set("currency", "COP");
  checkout.searchParams.set("amount-in-cents", String(montoEnCentavos));
  checkout.searchParams.set("reference", referencia);
  checkout.searchParams.set("signature:integrity", firma);
  checkout.searchParams.set("redirect-url", new URL("/pago/resultado", origen).toString());
  checkout.searchParams.set("customer-data:email", pedido.comprador_correo);
  checkout.searchParams.set("customer-data:full-name", pedido.comprador_nombre);
  checkout.searchParams.set("customer-data:phone-number", pedido.comprador_telefono);
  checkout.searchParams.set("customer-data:legal-id", pedido.comprador_numero_documento);
  checkout.searchParams.set("customer-data:legal-id-type", pedido.comprador_tipo_documento);
  return checkout.toString();
}
