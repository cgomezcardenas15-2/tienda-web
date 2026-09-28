export type CategoriaProducto = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  orden: number;
};

export const CATEGORIAS_PREDETERMINADAS = [
  { nombre: "Piñatería", activo: true },
  { nombre: "Hogar", activo: true },
  { nombre: "Cacharrería", activo: true },
  { nombre: "Motos", activo: true },
];

export function esCategoriaPredeterminada(nombre: string) {
  return CATEGORIAS_PREDETERMINADAS.some((categoria) => categoria.nombre === nombre);
}

export function slugCategoria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
