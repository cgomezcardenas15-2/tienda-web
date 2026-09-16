import "server-only";
import ExcelJS from "exceljs";
import { IDENTIDAD_COMERCIAL } from "./identidadComercial";

export type GastoExcel = Record<string, any>;
export type CierreExcel = Record<string, any>;
const moneda = '"$"#,##0;[Red]("$"#,##0);-';
const formatoDinero = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function crearLibro(titulo: string, columnas: Partial<ExcelJS.Column>[]) {
  const libro = new ExcelJS.Workbook();
  libro.creator = IDENTIDAD_COMERCIAL.nombreComercial; libro.created = new Date(); libro.modified = new Date(); libro.subject = titulo;
  const hoja = libro.addWorksheet(titulo.slice(0, 31), { views: [{ showGridLines: false, state: "frozen", ySplit: 12 }] });
  hoja.properties.defaultRowHeight = 20; hoja.columns = columnas;
  hoja.mergeCells("A2:F2"); hoja.getCell("A2").value = "SEÑOR NOVA"; hoja.getCell("A2").font = { name: "Aptos Display", bold: true, size: 18, color: { argb: "FF111311" } };
  hoja.mergeCells("G2:J2"); hoja.getCell("G2").value = "CONTROL FINANCIERO"; hoja.getCell("G2").font = { name: "Aptos", bold: true, size: 10, color: { argb: "FF579900" } }; hoja.getCell("G2").alignment = { horizontal: "right" };
  hoja.mergeCells("A3:F3"); hoja.getCell("A3").value = titulo; hoja.getCell("A3").font = { name: "Aptos Display", bold: true, size: 14, color: { argb: "FF3F3F46" } };
  hoja.mergeCells("G3:J3"); hoja.getCell("G3").value = `NIT ${IDENTIDAD_COMERCIAL.nitCompleto}`; hoja.getCell("G3").font = { name: "Aptos", bold: true, size: 9, color: { argb: "FF52525B" } }; hoja.getCell("G3").alignment = { horizontal: "right" };
  hoja.mergeCells("A4:F4"); hoja.getCell("A4").value = `${IDENTIDAD_COMERCIAL.propietario} · ${IDENTIDAD_COMERCIAL.direccionCompleta}`; hoja.getCell("A4").font = { name: "Aptos", size: 9, color: { argb: "FF71717A" } };
  hoja.mergeCells("G4:J4"); hoja.getCell("G4").value = `Generado: ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date())}`; hoja.getCell("G4").font = { name: "Aptos", italic: true, size: 9, color: { argb: "FF71717A" } }; hoja.getCell("G4").alignment = { horizontal: "right" };
  hoja.mergeCells("A5:J5"); hoja.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF84CC16" } }; hoja.getRow(5).height = 4;
  hoja.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: .3, right: .3, top: .45, bottom: .45, header: .2, footer: .2 } };
  hoja.headerFooter.oddFooter = `${IDENTIDAD_COMERCIAL.nombreComercial} · ${titulo} · Página &P de &N`;
  return { libro, hoja };
}

function tarjetas(hoja: ExcelJS.Worksheet, datos: Array<[string, string, number, boolean?]>) {
  datos.forEach(([inicio, etiqueta, valor, cantidad], indice) => {
    const columna = inicio.charAt(0); const fin = String.fromCharCode(columna.charCodeAt(0) + 2);
    hoja.mergeCells(`${columna}7:${fin}7`); hoja.mergeCells(`${columna}8:${fin}9`);
    const etiquetaCelda = hoja.getCell(`${columna}7`); etiquetaCelda.value = etiqueta.toUpperCase(); etiquetaCelda.font = { name: "Aptos", bold: true, size: 9, color: { argb: "FF71717A" } }; etiquetaCelda.alignment = { vertical: "bottom" };
    const valorCelda = hoja.getCell(`${columna}8`); valorCelda.value = cantidad ? valor : formatoDinero.format(valor); valorCelda.font = { name: "Aptos Display", bold: true, size: 16, color: { argb: indice === 0 ? "FF579900" : indice === 2 && valor !== 0 ? "FFB45309" : "FF18181B" } }; valorCelda.alignment = { vertical: "middle" };
    for (const rango of [`${columna}7:${fin}7`, `${columna}8:${fin}9`]) hoja.getCell(rango.split(":")[0]).fill = { type: "pattern", pattern: "solid", fgColor: { argb: indice === 0 ? "FFF7FEE7" : "FFF4F4F5" } };
    etiquetaCelda.border = { top: { style: "thin", color: { argb: indice === 0 ? "FFA3E635" : "FFD4D4D8" } }, left: { style: "thin", color: { argb: "FFD4D4D8" } }, right: { style: "thin", color: { argb: "FFD4D4D8" } } };
    valorCelda.border = { bottom: { style: "thin", color: { argb: "FFD4D4D8" } }, left: { style: "thin", color: { argb: "FFD4D4D8" } }, right: { style: "thin", color: { argb: "FFD4D4D8" } } };
  });
  hoja.getRow(7).height = 22; hoja.getRow(8).height = 22; hoja.getRow(9).height = 22;
}

function cabecera(hoja: ExcelJS.Worksheet, nombres: string[]) {
  const fila = hoja.getRow(12); fila.values = nombres; fila.height = 30;
  fila.eachCell((celda) => { celda.font = { name: "Aptos", bold: true, color: { argb: "FFFFFFFF" } }; celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } }; celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; });
}

function baseFila(fila: ExcelJS.Row) {
  fila.height = 24; fila.font = { name: "Aptos", size: 10, color: { argb: "FF27272A" } };
  fila.eachCell((celda) => { celda.border = { bottom: { style: "thin", color: { argb: "FFE4E4E7" } } }; celda.alignment = { vertical: "middle" }; });
}

export async function reporteGastos(gastos: GastoExcel[]) {
  const { libro, hoja } = crearLibro("Reporte de gastos", [{ width: 14 }, { width: 20 }, { width: 38 }, { width: 17 }, { width: 18 }, { width: 23 }, { width: 14 }, { width: 15 }, { width: 34 }, { width: 22 }]);
  const activos = gastos.filter(g => g.estado === "registrado").reduce((s, g) => s + Number(g.valor || 0), 0);
  const anulados = gastos.filter(g => g.estado === "anulado").reduce((s, g) => s + Number(g.valor || 0), 0);
  tarjetas(hoja, [["A7", "Gastos vigentes", activos], ["D7", "Gastos anulados", anulados], ["G7", "Registros", gastos.length, true]]);
  cabecera(hoja, ["Fecha", "Categoría", "Descripción", "Valor", "Medio de pago", "Comprobante", "Recurrente", "Estado", "Notas", "Registrado en"]);
  gastos.forEach((gasto, i) => {
    const relacion = gasto.categorias_gasto as { nombre?: string } | { nombre?: string }[] | null; const categoria = Array.isArray(relacion) ? relacion[0]?.nombre : relacion?.nombre;
    const fila = hoja.getRow(13 + i); fila.values = [new Date(`${gasto.fecha}T12:00:00`), categoria ?? "Sin categoría", gasto.descripcion, Number(gasto.valor || 0), gasto.medio_pago, gasto.comprobante ?? "", gasto.recurrente ? "Sí" : "No", gasto.estado === "registrado" ? "Vigente" : "Anulado", gasto.notas ?? "", new Date(gasto.creado_en)]; baseFila(fila);
    fila.getCell(1).numFmt = "dd/mm/yyyy"; fila.getCell(4).numFmt = moneda; fila.getCell(4).alignment = { horizontal: "right", vertical: "middle" }; fila.getCell(10).numFmt = "dd/mm/yyyy hh:mm";
    const estado = fila.getCell(8); estado.font = { bold: true, color: { argb: gasto.estado === "registrado" ? "FF3F6212" : "FF991B1B" } }; estado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: gasto.estado === "registrado" ? "FFECFCCB" : "FFFEE2E2" } };
  });
  hoja.autoFilter = { from: "A12", to: `J${Math.max(12, 12 + gastos.length)}` };
  return libro.xlsx.writeBuffer();
}

export async function reporteCierres(cierres: CierreExcel[]) {
  const { libro, hoja } = crearLibro("Cierres diarios", [{ width: 14 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 20 }, { width: 18 }, { width: 18 }, { width: 17 }, { width: 38 }, { width: 22 }]);
  const ventas = cierres.reduce((s, c) => s + Number(c.ventas_aprobadas || 0), 0); const egresos = cierres.reduce((s, c) => s + Number(c.reembolsos || 0) + Number(c.gastos || 0) + Number(c.comisiones_pagadas || 0), 0); const diferencia = cierres.reduce((s, c) => s + Number(c.diferencia || 0), 0);
  tarjetas(hoja, [["A7", "Ventas registradas", ventas], ["D7", "Egresos registrados", egresos], ["G7", "Diferencia acumulada", diferencia]]);
  cabecera(hoja, ["Fecha", "Ventas aprobadas", "Reembolsos", "Gastos", "Comisiones pagadas", "Saldo esperado", "Saldo reportado", "Diferencia", "Observaciones", "Cerrado en"]);
  cierres.forEach((cierre, i) => { const fila = hoja.getRow(13 + i); fila.values = [new Date(`${cierre.fecha}T12:00:00`), Number(cierre.ventas_aprobadas || 0), Number(cierre.reembolsos || 0), Number(cierre.gastos || 0), Number(cierre.comisiones_pagadas || 0), Number(cierre.saldo_esperado || 0), Number(cierre.saldo_reportado || 0), Number(cierre.diferencia || 0), cierre.observaciones ?? "", new Date(cierre.creado_en)]; baseFila(fila); fila.getCell(1).numFmt = "dd/mm/yyyy"; for (let j = 2; j <= 8; j++) { fila.getCell(j).numFmt = moneda; fila.getCell(j).alignment = { horizontal: "right", vertical: "middle" }; } fila.getCell(10).numFmt = "dd/mm/yyyy hh:mm"; const dif = Number(cierre.diferencia || 0); fila.getCell(8).font = { bold: true, color: { argb: dif === 0 ? "FF3F6212" : dif < 0 ? "FF991B1B" : "FF92400E" } }; });
  hoja.autoFilter = { from: "A12", to: `J${Math.max(12, 12 + cierres.length)}` };
  return libro.xlsx.writeBuffer();
}
