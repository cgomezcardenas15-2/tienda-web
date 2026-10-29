import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = { title: "Política de cookies | NOVA" };

export default function CookiesPage() {
  return <LegalPage eyebrow="Preferencias del sitio" title="Política de cookies" intro="NOVA utiliza tecnologías esenciales para que la tienda funcione y, únicamente con tu autorización, herramientas de medición publicitaria." sections={[
    { title: "Tecnologías esenciales", items: ["Almacenamiento local del carrito para conservar los productos elegidos.", "Registro de la preferencia de cookies seleccionada.", "Cookies de sesión estrictamente necesarias en el acceso privado de administración."] },
    { title: "Medición publicitaria opcional", paragraphs: ["Si eliges “Aceptar medición”, NOVA activa Meta Pixel para conocer visitas y navegación dentro de la tienda, medir el resultado de campañas y mejorar la publicidad. Esta tecnología puede compartir con Meta datos técnicos y de interacción, de acuerdo con sus propias políticas. El píxel permanece desactivado cuando eliges “Solo necesarias”."] },
    { title: "Pagos y servicios externos", paragraphs: ["Al continuar al pago, el comprador visita la plataforma segura del proveedor de pagos, que aplica sus propias políticas y tecnologías. NOVA verifica el resultado sin almacenar los datos completos de la tarjeta."] },
    { title: "Cómo cambiar tu decisión", paragraphs: ["Puedes abrir “Preferencias de cookies” desde el pie de cualquier página y cambiar tu elección. También puedes borrar las cookies y el almacenamiento local desde la configuración del navegador; al hacerlo, el carrito puede vaciarse y algunas preferencias deberán configurarse nuevamente."] },
    { title: "Cambios y contacto", paragraphs: ["Esta lista se revisará cuando cambien las herramientas utilizadas. Los canales oficiales publicados en la política de privacidad están disponibles para preguntas sobre el tratamiento de datos."] },
  ]} />;
}
