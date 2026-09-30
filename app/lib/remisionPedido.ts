import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { IDENTIDAD_COMERCIAL } from "@/app/lib/identidadComercial";

export async function cargarRemision(id: string) {
  const [{ data: pedido, error }, { data: productos, error: productosError }] = await Promise.all([
    supabaseAdmin.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("productos_pedido").select("*").eq("pedido_id", id).order("id"),
  ]);
  if (error || !pedido) return null;
  if (productosError) throw new Error("No fue posible cargar los productos de la remisión.");
  return { pedido, productos: productos || [] };
}

export function textoRemision(valor: unknown, alternativa = "-") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : alternativa;
}

export function nombreArchivoRemision(numero: unknown, extension: string) {
  return `Remision-${String(numero).replace(/[^A-Za-z0-9-]/g, "")}.${extension}`;
}

const pesos = (valor: unknown) => `$ ${Math.round(Number(valor) || 0).toLocaleString("es-CO")}`;

export async function generarPdfRemision(id: string) {
  const datos = await cargarRemision(id);
  if (!datos) return null;

  const { pedido, productos } = datos;
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pagina = pdf.addPage([595.28, 841.89]);
  const verde = rgb(0.36, 0.68, 0.04);
  const negro = rgb(0.05, 0.06, 0.05);
  const gris = rgb(0.42, 0.44, 0.43);
  const borde = rgb(0.86, 0.87, 0.85);
  const x = 44;

  pagina.drawRectangle({ x, y: 755, width: 38, height: 38, color: verde });
  pagina.drawText("N", { x: 56, y: 766, size: 18, font: bold, color: negro });
  pagina.drawText("NOVA", { x: 94, y: 775, size: 20, font: bold, color: negro });
  pagina.drawText("TODO LO QUE NECESITAS", { x: 94, y: 760, size: 7, font: bold, color: verde });
  pagina.drawText("REMISION DE VENTA", { x: 430, y: 779, size: 9, font: bold, color: verde });
  pagina.drawText(`REM-${textoRemision(pedido.numero_pedido)}`, { x: 395, y: 758, size: 13, font: bold, color: negro });
  pagina.drawLine({ start: { x, y: 735 }, end: { x: 551, y: 735 }, thickness: 1.5, color: borde });

  const cliente = textoRemision(pedido.facturacion_razon_social || pedido.facturacion_nombre || pedido.comprador_razon_social || pedido.comprador_nombre).slice(0, 60);
  pagina.drawText("CLIENTE", { x, y: 704, size: 7, font: bold, color: gris });
  pagina.drawText(cliente, { x, y: 684, size: 13, font: bold, color: negro });
  pagina.drawText(textoRemision(pedido.facturacion_correo || pedido.comprador_correo).slice(0, 70), { x, y: 665, size: 8, font: normal, color: gris });
  const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(pedido.creado_en));
  pagina.drawText(`Fecha: ${fecha}`, { x: 400, y: 684, size: 8, font: normal, color: gris });
  pagina.drawText(`Pago: ${textoRemision(pedido.estado_pago).toUpperCase()}`, { x: 400, y: 665, size: 8, font: bold, color: verde });

  let y = 610;
  pagina.drawRectangle({ x, y, width: 507, height: 28, color: negro });
  pagina.drawText("PRODUCTO", { x: 56, y: y + 10, size: 7, font: bold, color: rgb(1, 1, 1) });
  pagina.drawText("CANT.", { x: 360, y: y + 10, size: 7, font: bold, color: rgb(1, 1, 1) });
  pagina.drawText("UNITARIO", { x: 410, y: y + 10, size: 7, font: bold, color: rgb(1, 1, 1) });
  pagina.drawText("TOTAL", { x: 500, y: y + 10, size: 7, font: bold, color: rgb(1, 1, 1) });
  y -= 32;

  for (const producto of productos.slice(0, 12)) {
    const cantidad = Number(producto.cantidad) || 0;
    const precio = Number(producto.precio_unitario) || 0;
    const descripcion = `${textoRemision(producto.nombre)}${producto.variante_nombre ? ` - ${producto.variante_nombre}` : ""}`.slice(0, 58);
    pagina.drawText(descripcion, { x: 56, y, size: 8, font: bold, color: negro });
    pagina.drawText(String(cantidad), { x: 368, y, size: 9, font: bold, color: negro });
    pagina.drawText(pesos(precio), { x: 410, y, size: 8, font: normal, color: negro });
    pagina.drawText(pesos(precio * cantidad), { x: 490, y, size: 8, font: bold, color: negro });
    pagina.drawLine({ start: { x, y: y - 13 }, end: { x: 551, y: y - 13 }, thickness: 0.7, color: borde });
    y -= 30;
  }

  const totalY = Math.max(185, y - 115);
  pagina.drawRectangle({ x: 345, y: totalY, width: 206, height: 102, color: rgb(0.97, 0.98, 0.96), borderColor: borde, borderWidth: 1 });
  const resumen: Array<[string, string]> = [
    ["Subtotal", pesos(pedido.subtotal)],
    ["Envio", pesos(pedido.costo_envio)],
    ["Descuento", `- ${pesos(pedido.descuento)}`],
  ];
  resumen.forEach(([etiqueta, valor], i) => {
    pagina.drawText(etiqueta, { x: 358, y: totalY + 81 - i * 19, size: 8, font: normal, color: gris });
    pagina.drawText(valor, { x: 475, y: totalY + 81 - i * 19, size: 8, font: bold, color: negro });
  });
  pagina.drawLine({ start: { x: 358, y: totalY + 27 }, end: { x: 538, y: totalY + 27 }, thickness: 1.2, color: negro });
  pagina.drawText("TOTAL", { x: 358, y: totalY + 10, size: 11, font: bold, color: negro });
  pagina.drawText(pesos(pedido.total), { x: 472, y: totalY + 10, size: 12, font: bold, color: verde });
  pagina.drawText(`${IDENTIDAD_COMERCIAL.nombreComercial} - ${IDENTIDAD_COMERCIAL.propietario} - NIT ${IDENTIDAD_COMERCIAL.nitCompleto}`, { x: 150, y: 70, size: 7, font: bold, color: gris });
  pagina.drawText(`${IDENTIDAD_COMERCIAL.direccionCompleta} - Tel. ${IDENTIDAD_COMERCIAL.telefono}`, { x: 142, y: 55, size: 7, font: normal, color: gris });
  pagina.drawText("Documento comercial de remision. No constituye factura electronica.", { x: 174, y: 38, size: 7, font: normal, color: gris });

  return {
    bytes: await pdf.save(),
    nombre: nombreArchivoRemision(pedido.numero_pedido, "pdf"),
  };
}
