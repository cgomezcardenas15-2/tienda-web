import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminSession } from "@/app/lib/adminAuth";
import { cargarRemision, nombreArchivoRemision, textoRemision } from "@/app/lib/remisionPedido";
import { IDENTIDAD_COMERCIAL } from "@/app/lib/identidadComercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  const { id } = await context.params;
  const datos = await cargarRemision(id);
  if (!datos) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  const { pedido, productos } = datos;
  const libro = new ExcelJS.Workbook();
  libro.creator = IDENTIDAD_COMERCIAL.nombreComercial;
  libro.created = new Date();
  const hoja = libro.addWorksheet("Remisión", { views: [{ showGridLines: false }] });
  hoja.columns = [{ width: 34 }, { width: 22 }, { width: 14 }, { width: 18 }, { width: 18 }];
  hoja.mergeCells("A2:E2"); hoja.getCell("A2").value = "NOVA"; hoja.getCell("A2").font = { bold: true, size: 20, color: { argb: "FF111311" } };
  hoja.mergeCells("A3:E3"); hoja.getCell("A3").value = `${IDENTIDAD_COMERCIAL.nombreComercial} · REMISIÓN REM-${pedido.numero_pedido}`; hoja.getCell("A3").font = { bold: true, size: 14, color: { argb: "FF579900" } };
  hoja.mergeCells("A4:E4"); hoja.getCell("A4").value = `${IDENTIDAD_COMERCIAL.propietario} · NIT ${IDENTIDAD_COMERCIAL.nitCompleto} · ${IDENTIDAD_COMERCIAL.responsabilidadIva} · Teléfono y WhatsApp ${IDENTIDAD_COMERCIAL.telefono}`; hoja.getCell("A4").font = { size: 10, color: { argb: "FF666666" } };
  hoja.mergeCells("A5:E5"); hoja.getCell("A5").value = `${IDENTIDAD_COMERCIAL.direccionCompleta} · ${IDENTIDAD_COMERCIAL.correo}`; hoja.getCell("A5").font = { size: 10, color: { argb: "FF666666" } };
  hoja.getCell("A7").value = "Cliente"; hoja.getCell("B7").value = textoRemision(pedido.facturacion_razon_social || pedido.facturacion_nombre || pedido.comprador_nombre);
  hoja.getCell("A8").value = "Documento"; hoja.getCell("B8").value = `${textoRemision(pedido.comprador_tipo_documento)} ${textoRemision(pedido.comprador_numero_documento)}`;
  hoja.getCell("A9").value = "Correo"; hoja.getCell("B9").value = textoRemision(pedido.comprador_correo);
  hoja.getCell("A10").value = "Entrega"; hoja.getCell("B10").value = `${textoRemision(pedido.entrega_direccion)}, ${textoRemision(pedido.entrega_ciudad)}, ${textoRemision(pedido.entrega_departamento)}`;
  hoja.mergeCells("B7:E7"); hoja.mergeCells("B8:E8"); hoja.mergeCells("B9:E9"); hoja.mergeCells("B10:E10");
  const cabecera = hoja.getRow(12); cabecera.values = ["Producto", "SKU", "Cantidad", "Valor unitario", "Total"];
  cabecera.eachCell((celda) => { celda.font = { bold: true, color: { argb: "FFFFFFFF" } }; celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111311" } }; celda.alignment = { horizontal: "center", vertical: "middle" }; });
  productos.forEach((producto, indice) => { const fila = hoja.getRow(13 + indice); const cantidad = Number(producto.cantidad), precio = Number(producto.precio_unitario); fila.values = [`${producto.nombre}${producto.variante_nombre ? ` - ${producto.variante_nombre}` : ""}`, producto.variante_sku || "", cantidad, precio, cantidad * precio]; fila.getCell(3).numFmt = "#,##0"; fila.getCell(4).numFmt = '"$"#,##0'; fila.getCell(5).numFmt = '"$"#,##0'; });
  const inicioTotales = 14 + productos.length;
  [["Subtotal", Number(pedido.subtotal)], ["Envío", Number(pedido.costo_envio)], ["Descuento", -Number(pedido.descuento)], ["Total", Number(pedido.total)]].forEach(([etiqueta, valor], i) => { const fila = hoja.getRow(inicioTotales + i); fila.getCell(4).value = etiqueta; fila.getCell(5).value = valor; fila.getCell(5).numFmt = '"$"#,##0'; if (i === 3) fila.font = { bold: true, size: 13, color: { argb: "FF579900" } }; });
  hoja.getCell(`A${inicioTotales + 6}`).value = `${IDENTIDAD_COMERCIAL.nombreComercial} - Remisión comercial - Documento no fiscal`; hoja.getCell(`A${inicioTotales + 6}`).font = { italic: true, size: 9, color: { argb: "FF777777" } }; hoja.mergeCells(`A${inicioTotales + 6}:E${inicioTotales + 6}`);
  hoja.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  const buffer = await libro.xlsx.writeBuffer();
  return new Response(Buffer.from(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${nombreArchivoRemision(pedido.numero_pedido, "xlsx")}"`, "Cache-Control": "private, no-store" } });
}
