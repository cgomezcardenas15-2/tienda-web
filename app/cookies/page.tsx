import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = { title: "Política de cookies | NOVA" };

export default function CookiesPage() {
  return <LegalPage eyebrow="Preferencias del sitio" title="Política de cookies" intro="NOVA busca usar únicamente las tecnologías necesarias para que la tienda funcione y explicar de manera sencilla qué se guarda en tu navegador." sections={[
    { title: "Qué usamos actualmente", items: ["Almacenamiento local del carrito para conservar los productos elegidos.", "Registro de que el aviso de cookies ya fue leído.", "Cookies de sesión estrictamente necesarias en el acceso privado de administración."] },
    { title: "Qué no usamos actualmente", paragraphs: ["En esta etapa NOVA no utiliza cookies publicitarias, perfiles de comportamiento ni herramientas de analítica para rastrear visitantes. Si esto cambia, la política y el mecanismo de consentimiento se actualizarán antes de activarlas."] },
    { title: "Pagos y servicios externos", paragraphs: ["Al continuar al pago, el comprador visita la plataforma segura del proveedor de pagos, que aplica sus propias políticas y tecnologías. NOVA verifica el resultado sin almacenar los datos completos de la tarjeta."] },
    { title: "Cómo administrar el almacenamiento", paragraphs: ["Puedes borrar cookies y almacenamiento local desde la configuración del navegador. Al hacerlo, el carrito puede vaciarse y algunas preferencias deberán configurarse nuevamente."] },
    { title: "Cambios y contacto", paragraphs: ["Esta lista se revisará al incorporar dominio, analítica, soporte, WhatsApp u otros servicios. Antes de la apertura se publicará el canal oficial para preguntas sobre privacidad."] },
  ]} />;
}
