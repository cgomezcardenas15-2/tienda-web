import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getAdminSession } from "@/app/lib/adminAuth";
import { cargarRemision, nombreArchivoRemision, textoRemision } from "@/app/lib/remisionPedido";
import { IDENTIDAD_COMERCIAL } from "@/app/lib/identidadComercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pesos = (valor: unknown) => `$ ${Math.round(Number(valor) || 0).toLocaleString("es-CO")}`;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const { id } = await context.params;
  const datos = await cargarRemision(id);
  if (!datos) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  const { pedido, productos } = datos;
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  const verde = rgb(0.36, 0.68, 0.04), negro = rgb(0.05, 0.06, 0.05), gris = rgb(0.42, 0.44, 0.43), borde = rgb(0.86, 0.87, 0.85);
  const x = 44, ancho = 507;

  page.drawRectangle({ x, y: 755, width: 38, height: 38, color: verde });
  page.drawText("N", { x: 56, y: 766, size: 18, font: bold, color: negro });
  page.drawText("NOVA", { x: 94, y: 775, size: 20, font: bold, color: negro });
  page.drawText("TODO LO QUE NECESITAS", { x: 94, y: 760, size: 7, font: bold, color: verde });
  page.drawText(`EMITIDO POR ${IDENTIDAD_COMERCIAL.nombreComercial.toUpperCase()}`, { x: 94, y: 748, size: 6, font: normal, color: gris });
  page.drawText("REMISION", { x: 450, y: 779, size: 9, font: bold, color: verde });
  page.drawText(`REM-${pedido.numero_pedido}`, { x: 395, y: 758, size: 14, font: bold, color: negro });
  page.drawLine({ start: { x, y: 735 }, end: { x: x + ancho, y: 735 }, thickness: 1.5, color: borde });

  const nombre = textoRemision(pedido.facturacion_razon_social || pedido.facturacion_nombre || pedido.comprador_razon_social || pedido.comprador_nombre).slice(0, 52);
  page.drawText("CLIENTE", { x, y: 704, size: 7, font: bold, color: gris });
  page.drawText(nombre, { x, y: 684, size: 13, font: bold, color: negro });
  page.drawText(`${textoRemision(pedido.facturacion_tipo_documento || pedido.comprador_tipo_documento)} ${textoRemision(pedido.facturacion_numero_documento || pedido.comprador_numero_documento)}`, { x, y: 667, size: 8, font: normal, color: gris });
  page.drawText(textoRemision(pedido.facturacion_correo || pedido.comprador_correo).slice(0, 60), { x, y: 652, size: 8, font: normal, color: gris });
  const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(pedido.creado_en));
  page.drawText("PEDIDO", { x: 408, y: 704, size: 7, font: bold, color: gris });
  page.drawText(textoRemision(pedido.numero_pedido), { x: 408, y: 684, size: 12, font: bold, color: negro });
  page.drawText(fecha, { x: 408, y: 667, size: 8, font: normal, color: gris });
  page.drawText(`PAGO ${textoRemision(pedido.estado_pago).toUpperCase()}`, { x: 408, y: 652, size: 8, font: bold, color: verde });
  page.drawText("ENTREGAR EN", { x, y: 620, size: 7, font: bold, color: gris });
  const direccion = `${textoRemision(pedido.entrega_direccion)}${pedido.entrega_complemento ? `, ${pedido.entrega_complemento}` : ""} - ${textoRemision(pedido.entrega_ciudad)}, ${textoRemision(pedido.entrega_departamento)}`;
  page.drawText(direccion.slice(0, 105), { x, y: 602, size: 9, font: normal, color: negro });

  let y = 558;
  page.drawRectangle({ x, y, width: ancho, height: 28, color: negro });
  [["PRODUCTO", 56], ["CANT.", 357], ["UNITARIO", 411], ["TOTAL", 500]].forEach(([t, pos]) => page.drawText(String(t), { x: Number(pos), y: y + 10, size: 7, font: bold, color: rgb(1, 1, 1) }));
  y -= 32;
  for (const producto of productos.slice(0, 10)) {
    const cantidad = Number(producto.cantidad), precio = Number(producto.precio_unitario);
    const descripcion = `${textoRemision(producto.nombre)}${producto.variante_nombre ? ` - ${producto.variante_nombre}` : ""}`.slice(0, 58);
    page.drawText(descripcion, { x: 56, y, size: 8, font: bold, color: negro });
    page.drawText(String(cantidad), { x: 368, y, size: 9, font: bold, color: negro });
    page.drawText(pesos(precio), { x: 411, y, size: 8, font: normal, color: negro });
    page.drawText(pesos(precio * cantidad), { x: 490, y, size: 8, font: bold, color: negro });
    page.drawLine({ start: { x, y: y - 13 }, end: { x: x + ancho, y: y - 13 }, thickness: 0.7, color: borde });
    y -= 30;
  }

  const totalY = Math.max(230, y - 112);
  page.drawRectangle({ x: 345, y: totalY, width: 206, height: 102, color: rgb(0.97, 0.98, 0.96), borderColor: borde, borderWidth: 1 });
  [["Subtotal", pesos(pedido.subtotal)], ["Envio", pesos(pedido.costo_envio)], ["Descuento", `- ${pesos(pedido.descuento)}`]].forEach(([etiqueta, valor], i) => { page.drawText(etiqueta, { x: 358, y: totalY + 81 - i * 19, size: 8, font: normal, color: gris }); page.drawText(valor, { x: 475, y: totalY + 81 - i * 19, size: 8, font: bold, color: negro }); });
  page.drawLine({ start: { x: 358, y: totalY + 27 }, end: { x: 538, y: totalY + 27 }, thickness: 1.2, color: negro });
  page.drawText("TOTAL", { x: 358, y: totalY + 10, size: 11, font: bold, color: negro });
  page.drawText(pesos(pedido.total), { x: 472, y: totalY + 10, size: 12, font: bold, color: verde });
  page.drawLine({ start: { x, y: 125 }, end: { x: 245, y: 125 }, thickness: 0.8, color: gris });
  page.drawLine({ start: { x: 350, y: 125 }, end: { x: 551, y: 125 }, thickness: 0.8, color: gris });
  page.drawText(`Preparado por ${IDENTIDAD_COMERCIAL.nombreComercial}`, { x: 82, y: 111, size: 8, font: normal, color: gris });
  page.drawText("Nombre y firma de recibido", { x: 393, y: 111, size: 8, font: normal, color: gris });
  page.drawText(`${IDENTIDAD_COMERCIAL.nombreComercial} - ${IDENTIDAD_COMERCIAL.propietario} - NIT ${IDENTIDAD_COMERCIAL.nitCompleto}`, { x: 153, y: 76, size: 7, font: bold, color: gris });
  page.drawText(`${IDENTIDAD_COMERCIAL.responsabilidadIva} - Matricula ${IDENTIDAD_COMERCIAL.matriculaMercantil} - CIIU ${IDENTIDAD_COMERCIAL.actividadPrincipal} / ${IDENTIDAD_COMERCIAL.actividadSecundaria}`, { x: 127, y: 63, size: 7, font: normal, color: gris });
  page.drawText(`${IDENTIDAD_COMERCIAL.direccionCompleta} - Tel. ${IDENTIDAD_COMERCIAL.telefono}`, { x: 142, y: 51, size: 7, font: normal, color: gris });
  page.drawText(`${IDENTIDAD_COMERCIAL.nombreComercial.toUpperCase()} - REMISION DE VENTA`, { x: 205, y: 36, size: 7, font: bold, color: gris });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nombreArchivoRemision(pedido.numero_pedido, "pdf")}"`, "Cache-Control": "private, no-store" } });
}
