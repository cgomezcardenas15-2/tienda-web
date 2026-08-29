export const CATEGORIAS_ACTIVAS = ["pinateria", "hogar", "mascotas"] as const;

export function normalizarCategoria(categoria: string) {
  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function esCategoriaActiva(categoria: string) {
  const categoriaNormalizada = normalizarCategoria(categoria);

  return (
    categoriaNormalizada.includes("pinater") ||
    categoriaNormalizada.includes("hogar") ||
    categoriaNormalizada.includes("mascota")
  );
}
