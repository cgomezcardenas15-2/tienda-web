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
  { id: "predeterminada-pinateria", nombre: "Piñatería", slug: "pinateria", descripcion: "Todo para celebrar momentos especiales.", icono: "🎉", activo: true, orden: 10 },
  { id: "predeterminada-hogar", nombre: "Hogar", slug: "hogar", descripcion: "Productos prácticos para cada espacio de tu hogar.", icono: "🏠", activo: true, orden: 20 },
  { id: "predeterminada-cacharreria", nombre: "Cacharrería", slug: "cacharreria", descripcion: "Artículos variados, útiles y prácticos para el día a día.", icono: "🛍️", activo: true, orden: 30 },
  { id: "predeterminada-motos", nombre: "Motos", slug: "motos", descripcion: "Accesorios y artículos útiles para motociclistas.", icono: "🏍️", activo: true, orden: 50 },
];

export function slugCategoria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
