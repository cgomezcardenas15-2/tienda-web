export type ProductoBuscable = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  sku?: string | null;
  categoria?: string | null;
  slug?: string | null;
};

export type VarianteBuscable = {
  producto_id: string;
  nombre?: string | null;
  color?: string | null;
  talla?: string | null;
  sku?: string | null;
};

const SINONIMOS: Record<string, string[]> = {
  bombas: ["globos"], globos: ["bombas"],
  lazo: ["mono", "moño"], mono: ["lazo", "moño"],
  chapa: ["candado"], candado: ["chapa"],
  lampara: ["linterna"], linterna: ["lampara"],
  cortar: ["tijera", "tijeras"], tijera: ["cortar", "tijeras"], tijeras: ["cortar", "tijera"],
  telefono: ["celular"], celular: ["telefono"],
  motocicleta: ["moto"], moto: ["motocicleta"],
  cosmetico: ["maquillaje"], maquillaje: ["cosmetico"],
};

export function normalizarBusqueda(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ").trim().replace(/\s+/g, " ");
}

function distancia(a: string, b: string) {
  if (a === b) return 0;
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let anterior = fila[0]; fila[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const guardado = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = guardado;
    }
  }
  return fila[b.length];
}

function puntuarToken(token: string, palabras: string[], texto: string) {
  if (palabras.includes(token)) return 30;
  if (palabras.some((palabra) => palabra.startsWith(token) || token.startsWith(palabra))) return 22;
  if (texto.includes(token)) return 15;
  const tolerancia = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
  return tolerancia && palabras.some((palabra) => Math.abs(palabra.length - token.length) <= tolerancia && distancia(token, palabra) <= tolerancia) ? 10 : 0;
}

export function ordenarProductosPorBusqueda<T extends ProductoBuscable>(productos: T[], variantes: VarianteBuscable[], consulta: string) {
  const query = normalizarBusqueda(consulta);
  if (!query) return productos;
  const originales = query.split(" ").filter(Boolean);
  const variantesPorProducto = new Map<string, VarianteBuscable[]>();
  for (const variante of variantes) {
    const lista = variantesPorProducto.get(variante.producto_id) ?? [];
    lista.push(variante); variantesPorProducto.set(variante.producto_id, lista);
  }

  return productos.map((producto, posicion) => {
    const nombre = normalizarBusqueda(producto.nombre);
    const opciones = variantesPorProducto.get(producto.id) ?? [];
    const texto = normalizarBusqueda([
      producto.nombre, producto.descripcion, producto.sku, producto.categoria, producto.slug,
      ...opciones.flatMap((opcion) => [opcion.nombre, opcion.color, opcion.talla, opcion.sku]),
    ].filter(Boolean).join(" "));
    const palabras = texto.split(" ");
    let puntos = nombre === query ? 150 : nombre.startsWith(query) ? 115 : nombre.includes(query) ? 90 : texto.includes(query) ? 70 : 0;
    let encontrados = 0;
    for (const original of originales) {
      const alternativas = [original, ...(SINONIMOS[original] ?? [])];
      const mejor = Math.max(...alternativas.map((token) => puntuarToken(token, palabras, texto)));
      if (mejor > 0) encontrados += 1;
      puntos += mejor + (nombre.split(" ").some((palabra) => alternativas.includes(palabra)) ? 18 : 0);
    }
    if (encontrados < originales.length) puntos = 0;
    return { producto, puntos, posicion };
  }).filter((resultado) => resultado.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.posicion - b.posicion)
    .map((resultado) => resultado.producto);
}
