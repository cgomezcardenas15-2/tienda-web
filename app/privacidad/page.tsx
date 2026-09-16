import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import { IDENTIDAD_COMERCIAL } from "../lib/identidadComercial";

export const metadata: Metadata = { title: "Privacidad y datos personales | NOVA" };

export default function PrivacidadPage() {
  return <LegalPage eyebrow="Protección de datos" title="Política de privacidad" intro="Esta política explica cómo NOVA recolectará, usará, almacenará y protegerá la información personal necesaria para operar la tienda." sections={[
    { title: "Responsable del tratamiento", paragraphs: [`${IDENTIDAD_COMERCIAL.propietario}, identificado con ${IDENTIDAD_COMERCIAL.tipoDocumento} ${IDENTIDAD_COMERCIAL.numeroDocumento} y NIT ${IDENTIDAD_COMERCIAL.nitCompleto}, es el propietario de ${IDENTIDAD_COMERCIAL.nombreComercial} y responsable del tratamiento de los datos recopilados mediante la tienda NOVA. Dirección: ${IDENTIDAD_COMERCIAL.direccionCompleta}. Teléfono y WhatsApp: ${IDENTIDAD_COMERCIAL.telefono}. Correo para consultas y reclamos: ${IDENTIDAD_COMERCIAL.correo}.`] },
    { title: "Datos tratados", items: ["Identificación y contacto: nombre, documento, correo, teléfono y dirección.", "Información del pedido, entrega, facturación y atención al cliente.", "Datos técnicos esenciales para seguridad y funcionamiento.", "NOVA no almacena los datos completos de la tarjeta; el pago es procesado por el proveedor autorizado."] },
    { title: "Finalidades", items: ["Validar, preparar, cobrar, entregar y dar seguimiento a pedidos.", "Emitir soportes, gestionar garantías, devoluciones y solicitudes.", "Prevenir fraude y proteger la seguridad del servicio.", "Cumplir obligaciones contables, tributarias, contractuales y legales.", "Enviar publicidad solo cuando exista autorización y permitir retirarla fácilmente."] },
    { title: "Derechos del titular", items: ["Conocer, actualizar y rectificar sus datos.", "Solicitar prueba de la autorización cuando corresponda.", "Conocer el uso dado a su información.", "Presentar consultas, reclamos o quejas ante la SIC.", "Revocar la autorización o solicitar supresión cuando sea procedente.", "Acceder gratuitamente a sus datos personales."] },
    { title: "Proveedores y circulación", paragraphs: ["La información podrá ser tratada por proveedores necesarios para alojamiento, base de datos, pagos, mensajería, facturación y soporte, bajo obligaciones de seguridad, confidencialidad y uso limitado a la finalidad autorizada."] },
    { title: "Seguridad y conservación", paragraphs: ["NOVA aplicará medidas razonables de seguridad y conservará la información solo durante el tiempo necesario para las finalidades informadas y las obligaciones legales. Ningún sistema elimina por completo todos los riesgos."] },
    { title: "Consultas y reclamos", paragraphs: ["Antes de iniciar ventas se publicará el correo oficial y el procedimiento completo con los términos legales de respuesta. Los cambios sustanciales a esta política serán informados oportunamente."] },
  ]} />;
}
