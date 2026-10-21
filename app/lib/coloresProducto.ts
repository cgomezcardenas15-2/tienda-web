export type ColorStockNuevo = {
  id: string;
  nombre: string;
  color: string;
  stock: string;
};

export const PALETA_COLORES_PRODUCTO = [
  { nombre: "Negro", color: "#111111", codigo: "NEG" },
  { nombre: "Blanco", color: "#ffffff", codigo: "BLA" },
  { nombre: "Verde", color: "#22c55e", codigo: "VER" },
  { nombre: "Rojo", color: "#ef4444", codigo: "ROJ" },
  { nombre: "Azul", color: "#3b82f6", codigo: "AZU" },
  { nombre: "Amarillo", color: "#facc15", codigo: "AMA" },
  { nombre: "Naranja", color: "#f97316", codigo: "NAR" },
  { nombre: "Rosado", color: "#ec4899", codigo: "ROS" },
  { nombre: "Morado", color: "#a855f7", codigo: "MOR" },
  { nombre: "Gris", color: "#71717a", codigo: "GRI" },
  { nombre: "Café", color: "#92400e", codigo: "CAF" },
  { nombre: "Beige", color: "#d6c7a1", codigo: "BEI" },
] as const;

function limpiarCodigo(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function codigoSkuColor(nombre: string, color: string) {
  const opcion = PALETA_COLORES_PRODUCTO.find(
    (item) => item.color.toLowerCase() === color.toLowerCase(),
  );
  if (opcion) return opcion.codigo;
  const codigoNombre = limpiarCodigo(nombre).slice(0, 6) || "COLOR";
  return `${codigoNombre}-${color.replace("#", "").toUpperCase()}`;
}

export function crearSkuColor(skuBase: string, nombre: string, color: string) {
  const base = limpiarCodigo(skuBase);
  const codigo = codigoSkuColor(nombre, color);
  return [base, codigo].filter(Boolean).join("-");
}
