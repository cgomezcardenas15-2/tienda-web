import { supabaseAdmin } from "./supabaseAdmin";

export type LineaRecibida = {
  id: string | number;
  varianteId?: string | null;
  cantidad: number;
};

export type LineaValidada = {
  id: string;
  varianteId?: string;
  nombre: string;
  sku?: string;
  varianteNombre?: string;
  varianteColor?: string;
  varianteTalla?: string;
  imagen?: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  stockDisponible: number;
};

export class ErrorValidacionProductos extends Error {
  constructor(
    message: string,
    public status = 400,
    public codigo?: string
  ) {
    super(message);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function validarLineasProducto(
  recibidas: LineaRecibida[]
): Promise<LineaValidada[]> {
  if (!Array.isArray(recibidas) || recibidas.length === 0) {
    throw new ErrorValidacionProductos("El carrito está vacío.");
  }

  const agrupadas = new Map<string, { id: string; varianteId?: string; cantidad: number }>();
  for (const linea of recibidas) {
    const id = String(linea?.id ?? "").trim();
    const varianteId = typeof linea?.varianteId === "string" && linea.varianteId.trim()
      ? linea.varianteId.trim()
      : undefined;
    if (!UUID.test(id) || (varianteId && !UUID.test(varianteId)) || !Number.isInteger(linea?.cantidad) || linea.cantidad <= 0) {
      throw new ErrorValidacionProductos("Uno o más productos del carrito no son válidos.");
    }
    const clave = `${id}:${varianteId ?? "base"}`;
    const anterior = agrupadas.get(clave);
    agrupadas.set(clave, { id, varianteId, cantidad: (anterior?.cantidad ?? 0) + linea.cantidad });
  }

  const idsProductos = [...new Set([...agrupadas.values()].map((linea) => linea.id))];
  const { data: productos, error: errorProductos } = await supabaseAdmin
    .from("productos")
    .select("id,nombre,sku,precio,controla_stock,stock,imagen_url,activo")
    .in("id", idsProductos)
    .eq("activo", true);
  if (errorProductos) throw new Error(`No fue posible consultar productos: ${errorProductos.message}`);
  if ((productos ?? []).length !== idsProductos.length) {
    throw new ErrorValidacionProductos("Uno o más productos ya no están disponibles.", 409);
  }

  const idsVariantes = [...agrupadas.values()].flatMap((linea) => linea.varianteId ? [linea.varianteId] : []);
  const { data: variantes, error: errorVariantes } = idsVariantes.length
    ? await supabaseAdmin.from("variantes_producto")
        .select("id,producto_id,nombre,color,talla,sku,precio,controla_stock,stock,imagen_url,activo")
        .in("id", idsVariantes).eq("activo", true)
    : { data: [], error: null };
  if (errorVariantes) throw new Error(`No fue posible consultar variantes: ${errorVariantes.message}`);
  if ((variantes ?? []).length !== new Set(idsVariantes).size) {
    throw new ErrorValidacionProductos("Una opción seleccionada ya no está disponible.", 409);
  }

  const { data: variantesActivas, error: errorActivas } = await supabaseAdmin
    .from("variantes_producto").select("producto_id").in("producto_id", idsProductos).eq("activo", true);
  if (errorActivas) throw new Error(`No fue posible validar las opciones: ${errorActivas.message}`);

  const mapaProductos = new Map((productos ?? []).map((producto) => [producto.id, producto]));
  const mapaVariantes = new Map((variantes ?? []).map((variante) => [variante.id, variante]));
  const productosConVariantes = new Set((variantesActivas ?? []).map((variante) => variante.producto_id));

  return [...agrupadas.values()].map((linea) => {
    const producto = mapaProductos.get(linea.id)!;
    const variante = linea.varianteId ? mapaVariantes.get(linea.varianteId) : undefined;
    if (variante && variante.producto_id !== producto.id) {
      throw new ErrorValidacionProductos("La opción elegida no corresponde al producto.", 409);
    }
    if (!variante && productosConVariantes.has(producto.id)) {
      throw new ErrorValidacionProductos(`Debes elegir una opción para "${producto.nombre}".`, 409);
    }
    const controlaStock = variante?.controla_stock ?? producto.controla_stock;
    const stock = variante?.stock ?? producto.stock;
    if (controlaStock && linea.cantidad > stock) {
      throw new ErrorValidacionProductos(
        `Solo hay ${stock} ${stock === 1 ? "unidad disponible" : "unidades disponibles"} de "${producto.nombre}${variante ? ` - ${variante.nombre}` : ""}".`,
        409,
        "STOCK_INSUFICIENTE"
      );
    }
    const precio = variante?.precio ?? producto.precio;
    return {
      id: producto.id,
      varianteId: variante?.id,
      nombre: producto.nombre.trim(),
      sku: variante?.sku ?? producto.sku ?? undefined,
      varianteNombre: variante?.nombre,
      varianteColor: variante?.color ?? undefined,
      varianteTalla: variante?.talla ?? undefined,
      imagen: variante?.imagen_url ?? producto.imagen_url ?? undefined,
      precio,
      cantidad: linea.cantidad,
      subtotal: precio * linea.cantidad,
      stockDisponible: stock,
    };
  });
}
