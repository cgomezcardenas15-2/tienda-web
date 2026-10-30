import "server-only";

const DOMINIO_PUBLICO = "https://www.senornova.com.co";

export type ProductoCatalogoMeta = {
  id: string;
  sku: string | null;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio: number;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
};

export type VarianteCatalogoMeta = {
  id: string;
  producto_id: string;
  nombre: string;
  color: string | null;
  talla: string | null;
  sku: string;
  precio: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
};

export type CategoriaCatalogoMeta = {
  nombre: string;
  activo: boolean;
};

type FilaCatalogoMeta = {
  id: string;
  title: string;
  description: string;
  availability: "in stock" | "out of stock";
  condition: "new";
  price: string;
  link: string;
  image_link: string;
  item_group_id: string;
  color: string;
  size: string;
  product_type: string;
};

const ENCABEZADOS: Array<keyof FilaCatalogoMeta> = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "item_group_id",
  "color",
  "size",
  "product_type",
];

function normalizarCategoria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

function limpiarTexto(valor: string | null | undefined) {
  return (valor ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function esUrlHttpsPublica(valor: string | null | undefined) {
  if (!valor) return false;

  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}

function identificador(item: { id: string; sku?: string | null }) {
  return limpiarTexto(item.sku) || item.id;
}

function disponibilidad(controlaStock: boolean, stock: number): FilaCatalogoMeta["availability"] {
  return !controlaStock || Number(stock) > 0 ? "in stock" : "out of stock";
}

function enlaceProducto(id: string) {
  return `${DOMINIO_PUBLICO}/buscar?q=${encodeURIComponent(id)}`;
}

function celdaCsv(valor: string) {
  return `"${valor.replaceAll('"', '""')}"`;
}

export function construirCatalogoMeta({
  productos,
  variantes,
  categorias,
}: {
  productos: ProductoCatalogoMeta[];
  variantes: VarianteCatalogoMeta[];
  categorias: CategoriaCatalogoMeta[];
}) {
  const categoriasActivas = new Set(
    categorias
      .filter((categoria) => categoria.activo)
      .map((categoria) => normalizarCategoria(categoria.nombre)),
  );
  const variantesPorProducto = new Map<string, VarianteCatalogoMeta[]>();

  for (const variante of variantes) {
    if (!variante.activo) continue;
    const actuales = variantesPorProducto.get(variante.producto_id) ?? [];
    actuales.push(variante);
    variantesPorProducto.set(variante.producto_id, actuales);
  }

  for (const opciones of variantesPorProducto.values()) {
    opciones.sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
  }

  const filas: FilaCatalogoMeta[] = [];
  let omitidosSinImagen = 0;
  let omitidosSinDescripcion = 0;
  let omitidosPrecioInvalido = 0;

  for (const producto of productos) {
    if (!producto.activo || !categoriasActivas.has(normalizarCategoria(producto.categoria))) continue;

    const descripcion = limpiarTexto(producto.descripcion);
    if (!descripcion) {
      omitidosSinDescripcion += 1;
      continue;
    }

    const opciones = variantesPorProducto.get(producto.id) ?? [];
    const idGrupo = identificador(producto);

    if (opciones.length > 0) {
      for (const variante of opciones) {
        const precio = Number(variante.precio ?? producto.precio);
        const imagen = limpiarTexto(variante.imagen_url ?? producto.imagen_url);

        if (!Number.isFinite(precio) || precio <= 0) {
          omitidosPrecioInvalido += 1;
          continue;
        }
        if (!esUrlHttpsPublica(imagen)) {
          omitidosSinImagen += 1;
          continue;
        }

        const id = identificador(variante);
        filas.push({
          id,
          title: limpiarTexto(`${producto.nombre} - ${variante.nombre}`).slice(0, 200),
          description: descripcion.slice(0, 9999),
          availability: disponibilidad(variante.controla_stock, variante.stock),
          condition: "new",
          price: `${Math.round(precio)} COP`,
          link: enlaceProducto(limpiarTexto(variante.sku) || producto.nombre),
          image_link: imagen,
          item_group_id: idGrupo,
          color: variante.color ? limpiarTexto(variante.nombre) : "",
          size: limpiarTexto(variante.talla),
          product_type: limpiarTexto(producto.categoria),
        });
      }
      continue;
    }

    const precio = Number(producto.precio);
    const imagen = limpiarTexto(producto.imagen_url);

    if (!Number.isFinite(precio) || precio <= 0) {
      omitidosPrecioInvalido += 1;
      continue;
    }
    if (!esUrlHttpsPublica(imagen)) {
      omitidosSinImagen += 1;
      continue;
    }

    const id = identificador(producto);
    filas.push({
      id,
      title: limpiarTexto(producto.nombre).slice(0, 200),
      description: descripcion.slice(0, 9999),
      availability: disponibilidad(producto.controla_stock, producto.stock),
      condition: "new",
      price: `${Math.round(precio)} COP`,
      link: enlaceProducto(limpiarTexto(producto.sku) || producto.nombre),
      image_link: imagen,
      item_group_id: "",
      color: "",
      size: "",
      product_type: limpiarTexto(producto.categoria),
    });
  }

  filas.sort((a, b) => a.id.localeCompare(b.id));

  const ids = new Set<string>();
  for (const fila of filas) {
    if (ids.has(fila.id)) throw new Error(`ID duplicado en el catálogo Meta: ${fila.id}`);
    ids.add(fila.id);
  }

  const lineas = [
    ENCABEZADOS.join(","),
    ...filas.map((fila) => ENCABEZADOS.map((encabezado) => celdaCsv(fila[encabezado])).join(",")),
  ];

  return {
    csv: lineas.join("\r\n"),
    total: filas.length,
    omitidosSinImagen,
    omitidosSinDescripcion,
    omitidosPrecioInvalido,
  };
}
