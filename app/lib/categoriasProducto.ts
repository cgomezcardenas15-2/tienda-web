export type CategoriaProducto = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  orden: number;
};

export function slugCategoria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

