import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = { title: "Términos y condiciones | NOVA" };

export default function TerminosPage() {
  return <LegalPage eyebrow="Información legal" title="Términos y condiciones" intro="Estas condiciones regulan el acceso a NOVA y, una vez habilitadas las ventas reales, la compra de productos a través del sitio en Colombia." sections={[
    { title: "Identificación del proveedor", paragraphs: ["Antes de iniciar ventas reales se publicarán aquí la identidad legal del responsable de NOVA, NIT, dirección de notificación, teléfono, correo electrónico y demás canales oficiales de atención."] },
    { title: "Información de productos y precios", paragraphs: ["NOVA mostrará de forma clara las características esenciales, disponibilidad, precio total en pesos colombianos, impuestos aplicables, costos de envío y condiciones de la oferta antes de confirmar la compra."] },
    { title: "Proceso de compra y pago", paragraphs: ["El comprador podrá revisar y corregir la información de su pedido antes de pagar. Una orden se considerará pagada únicamente después de la confirmación verificable del proveedor de pagos. El comprobante y la información del pedido se conservarán conforme a la normativa aplicable."] },
    { title: "Entrega", paragraphs: ["Antes del pago se informarán cobertura, costo y condiciones estimadas de entrega. Los tiempos definitivos dependerán del destino y del transportador seleccionado, y serán comunicados al comprador."] },
    { title: "Retracto, reversión, garantías y devoluciones", paragraphs: ["NOVA atenderá los derechos del consumidor previstos en la Ley 1480 de 2011 y demás normas aplicables. Antes de vender se publicará el procedimiento, canal de solicitud, condiciones, excepciones y plazos correspondientes para cada tipo de producto."] },
    { title: "Uso adecuado del sitio", items: ["No intentar vulnerar la seguridad o disponibilidad del sitio.", "No suministrar información falsa o utilizar medios de pago sin autorización.", "No reproducir la identidad visual o contenidos de NOVA sin autorización."] },
    { title: "Atención y autoridad de consumo", paragraphs: ["Las solicitudes se atenderán por los canales oficiales que se publicarán antes de la apertura. El consumidor también podrá consultar a la Superintendencia de Industria y Comercio en www.sic.gov.co."] },
  ]} />;
}
