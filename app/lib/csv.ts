import "server-only";

function protegerFormula(valor: string) {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

function celda(valor: unknown) {
  if (valor === null || valor === undefined) return "";
  const texto = protegerFormula(String(valor).replaceAll("\r\n", " ").replaceAll("\n", " "));
  return `"${texto.replaceAll('"', '""')}"`;
}

export function crearCsv(encabezados: string[], filas: unknown[][]) {
  const lineas = [encabezados.map(celda).join(";"), ...filas.map((fila) => fila.map(celda).join(";"))];
  return `\uFEFF${lineas.join("\r\n")}`;
}

export function respuestaCsv(contenido: string, nombre: string) {
  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
