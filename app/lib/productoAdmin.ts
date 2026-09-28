import { normalizarCategoria } from "@/app/lib/categoriasActivas";

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function enteroPesos(valor: unknown) {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return Number.NaN;

  const limpio = valor.trim().replace(/[$\s]/g, "").replace(/\./g, "");
  return limpio === "" ? Number.NaN : Number(limpio);
}

function slugProducto(nombre: string) {
  return normalizarCategoria(nombre).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function limpiarProducto(body: Record<string, unknown>) {
  const nombre = texto(body.nombre);
  const precioAnteriorTexto = texto(body.precio_anterior);
  const controlaStock = body.controla_stock !== false;
  const ventaMayorista = body.venta_mayorista === true;
  const precioMayoristaTexto = texto(body.precio_mayorista);
  const minimoMayoristaTexto = texto(body.cantidad_minima_mayorista);
  return {
    nombre,
    slug: slugProducto(nombre),
    sku: texto(body.sku).toUpperCase(),
    descripcion: texto(body.descripcion),
    categoria: texto(body.categoria),
    precio: enteroPesos(body.precio),
    precio_anterior: precioAnteriorTexto === "" ? null : enteroPesos(body.precio_anterior),
    venta_mayorista: ventaMayorista,
    precio_mayorista: ventaMayorista && precioMayoristaTexto !== "" ? enteroPesos(body.precio_mayorista) : null,
    cantidad_minima_mayorista: ventaMayorista && minimoMayoristaTexto !== "" ? enteroPesos(body.cantidad_minima_mayorista) : null,
    controla_stock: controlaStock,
    stock: controlaStock ? enteroPesos(body.stock) : 0,
    imagen_url: texto(body.imagen_url) || null,
    destacado: body.destacado === true,
    en_oferta: body.en_oferta === true,
    activo: body.activo !== false,
  };
}

export function errorValidacionProducto(datos: ReturnType<typeof limpiarProducto>) {
  if (!datos.nombre || !datos.slug || !datos.sku || !datos.descripcion) return "Completa nombre, SKU y descripción.";
  if (!datos.categoria) return "Selecciona una categoría.";
  if (!Number.isInteger(datos.precio) || datos.precio < 0) return "El precio no es válido.";
  if (datos.precio_anterior !== null && (!Number.isInteger(datos.precio_anterior) || datos.precio_anterior <= datos.precio)) return "El precio anterior debe ser mayor al precio de venta.";
  if (datos.venta_mayorista && (!Number.isInteger(datos.precio_mayorista) || datos.precio_mayorista! < 0 || datos.precio_mayorista! >= datos.precio)) return "El precio mayorista debe ser menor al precio de detal.";
  if (datos.venta_mayorista && (!Number.isInteger(datos.cantidad_minima_mayorista) || datos.cantidad_minima_mayorista! < 2)) return "La cantidad mínima mayorista debe ser de 2 unidades o más.";
  if (!Number.isInteger(datos.stock) || datos.stock < 0) return "El stock no es válido.";
  return null;
}
