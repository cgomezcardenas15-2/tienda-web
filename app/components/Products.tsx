"use client";

import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import { getMetaContentId, trackMetaEvent } from "../lib/metaPixel";
import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| PRODUCTOS - NOVA
|--------------------------------------------------------------------------
|
| Este componente obtiene los productos reales desde Supabase.
|
| IMPORTANTE:
|
| - Utiliza el cliente público de Supabase.
| - NO utiliza supabaseAdmin.
| - NO utiliza la Secret Key.
| - RLS solamente permite consultar productos activos.
|
| El stock mostrado en pantalla sirve para la experiencia del usuario.
| El servidor vuelve a comprobar el stock real antes de aceptar un pedido.
|
*/

type ProductoSupabase = {
  id: string;
  sku: string | null;
  nombre: string;
  slug: string;
  descripcion: string | null;
  categoria: string;
  precio: number;
  precio_anterior: number | null;
  venta_mayorista: boolean;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  destacado: boolean;
  en_oferta: boolean;
  activo: boolean;
};

type VarianteProducto = {
  id: string;
  producto_id: string;
  nombre: string;
  color: string | null;
  talla: string | null;
  sku: string;
  precio: number | null;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
};

type ResultadoBusqueda = {
  producto_id: string;
  relevancia: number;
  total_count: number;
};

type ResultadoCatalogo = {
  producto_id: string;
  total_count: number;
};

type ProductsProps = {
  categoria?: string;
  subcategoriaId?: string;
  subcategoriaNombre?: string;
  busqueda?: string;
  ofertas?: boolean;
};

const PRODUCTOS_POR_PAGINA = 50;
const CAMPOS_PRODUCTO = `
  id,
  sku,
  nombre,
  slug,
  descripcion,
  categoria,
  precio,
  precio_anterior,
  venta_mayorista,
  precio_mayorista,
  cantidad_minima_mayorista,
  controla_stock,
  stock,
  imagen_url,
  destacado,
  en_oferta,
  activo
`;
const CAMPOS_VARIANTE =
  "id, producto_id, nombre, color, talla, sku, precio, precio_mayorista, cantidad_minima_mayorista, controla_stock, stock, imagen_url, activo, orden";

/*
|--------------------------------------------------------------------------
| FORMATO DE PRECIO
|--------------------------------------------------------------------------
*/

function formatoPesos(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function normalizarCategoria(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COLORES_VISUALES: Record<string, string> = {
  negro: "#111111",
  blanco: "#ffffff",
  verde: "#22c55e",
  rojo: "#ef4444",
  azul: "#3b82f6",
  amarillo: "#facc15",
  naranja: "#f97316",
  rosado: "#ec4899",
  rosa: "#ec4899",
  morado: "#a855f7",
  violeta: "#8b5cf6",
  gris: "#71717a",
  cafe: "#92400e",
  marron: "#92400e",
  beige: "#d6c7a1",
  dorado: "#d4a017",
  plateado: "#a1a1aa",
};

function muestraColor(valor: string | null) {
  if (!valor) return "#71717a";
  if (/^#[0-9a-f]{6}$/i.test(valor)) return valor;
  return COLORES_VISUALES[normalizarCategoria(valor)] ?? valor;
}

/*
|--------------------------------------------------------------------------
| ICONO TEMPORAL POR CATEGORÍA
|--------------------------------------------------------------------------
|
| Mientras agregamos las imágenes reales de cada producto,
| utilizamos un icono relacionado con su categoría.
|
*/

function obtenerIconoCategoria(
  categoria: string
) {
  const categoriaNormalizada =
    categoria
      .trim()
      .toLowerCase();

  if (
    categoriaNormalizada.includes(
      "tecnolog"
    )
  ) {
    return "⚡";
  }

  if (
    categoriaNormalizada.includes(
      "piñater"
    ) ||
    categoriaNormalizada.includes(
      "pinater"
    )
  ) {
    return "🎉";
  }

  if (
    categoriaNormalizada.includes(
      "hogar"
    )
  ) {
    return "🏠";
  }

  if (categoriaNormalizada.includes("cacharr")) {
    return "🛍️";
  }

  if (
    categoriaNormalizada.includes(
      "beb"
    )
  ) {
    return "🍼";
  }

  if (
    categoriaNormalizada.includes(
      "maquill"
    ) ||
    categoriaNormalizada.includes(
      "belleza"
    )
  ) {
    return "💄";
  }

  if (
    categoriaNormalizada.includes(
      "mascota"
    )
  ) {
    return "🐾";
  }

  if (categoriaNormalizada.includes("moto")) {
    return "🏍️";
  }

  if (
    categoriaNormalizada.includes(
      "ferreter"
    )
  ) {
    return "🔧";
  }

  return "📦";
}

/*
|--------------------------------------------------------------------------
| ETIQUETA DEL PRODUCTO
|--------------------------------------------------------------------------
*/

function obtenerEtiqueta(
  producto: ProductoSupabase
) {
  if (producto.en_oferta) {
    return "Oferta";
  }

  if (producto.destacado) {
    return "Destacado";
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| COMPONENTE PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function Products({ categoria, subcategoriaId, subcategoriaNombre, busqueda, ofertas = false }: ProductsProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<{
    url: string;
    nombre: string;
  } | null>(null);
  const { agregarProducto } =
    useCart();

  const [productos, setProductos] =
    useState<ProductoSupabase[]>([]);

  const modoOfertas = Boolean(ofertas && !categoria && !busqueda);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);

  const [variantes, setVariantes] =
    useState<Record<string, VarianteProducto[]>>({});

  const [varianteSeleccionada, setVarianteSeleccionada] =
    useState<Record<string, string>>({});

  const [cargando, setCargando] =
    useState(true);

  const [
    errorProductos,
    setErrorProductos,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CARGAR PRODUCTOS DESDE SUPABASE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let componenteActivo = true;

    async function cargarProductos() {
      setCargando(true);
      setErrorProductos("");

      try {
        const desde = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
        let productosPagina: ProductoSupabase[] = [];
        let total = 0;
        let idsOrdenados: string[] = [];

        if (busqueda) {
          const { data: coincidencias, error: errorBusqueda } = await supabase.rpc(
            "buscar_productos_publicos",
            {
              p_consulta: busqueda,
              p_desde: desde,
              p_limite: PRODUCTOS_POR_PAGINA,
            }
          );

          if (errorBusqueda) throw errorBusqueda;

          const resultados = (coincidencias ?? []) as ResultadoBusqueda[];
          idsOrdenados = resultados.map((item) => item.producto_id);
          total = Number(resultados[0]?.total_count ?? 0);
        } else {
          const consultaCatalogo = subcategoriaId
            ? supabase.rpc("listar_productos_publicos_v2", {
              p_categoria: categoria ?? null,
              p_subcategoria_id: subcategoriaId,
              p_modo: "categoria",
              p_desde: desde,
              p_limite: PRODUCTOS_POR_PAGINA,
            })
            : supabase.rpc("listar_productos_publicos", {
              p_categoria: categoria ?? null,
              p_modo: categoria ? "categoria" : modoOfertas ? "ofertas" : "destacados",
              p_desde: desde,
              p_limite: PRODUCTOS_POR_PAGINA,
            });
          const { data: coincidencias, error: errorCatalogo } = await consultaCatalogo;

          if (errorCatalogo) throw errorCatalogo;

          const resultados = (coincidencias ?? []) as ResultadoCatalogo[];
          idsOrdenados = resultados.map((item) => item.producto_id);
          total = Number(resultados[0]?.total_count ?? 0);
        }

        if (paginaActual > 1 && idsOrdenados.length === 0) {
          setPaginaActual(1);
          return;
        }

        if (idsOrdenados.length > 0) {
          const { data, error } = await supabase
            .from("productos")
            .select(CAMPOS_PRODUCTO)
            .eq("activo", true)
            .in("id", idsOrdenados);

          if (error) throw error;

          const productosPorId = new Map(
            ((data ?? []) as ProductoSupabase[]).map((producto) => [
              producto.id,
              producto,
            ])
          );
          productosPagina = idsOrdenados
            .map((id) => productosPorId.get(id))
            .filter((producto): producto is ProductoSupabase => Boolean(producto));
        }

        const idsPagina = productosPagina.map((producto) => producto.id);
        let variantesPagina: VarianteProducto[] = [];

        if (idsPagina.length > 0) {
          const { data, error } = await supabase
            .from("variantes_producto")
            .select(CAMPOS_VARIANTE)
            .in("producto_id", idsPagina)
            .eq("activo", true)
            .order("orden", { ascending: true });

          if (error) {
            console.error("Error cargando variantes:", error);
          } else {
            variantesPagina = (data ?? []) as VarianteProducto[];
          }
        }

        if (!componenteActivo) return;

        const agrupadas: Record<string, VarianteProducto[]> = {};
        for (const variante of variantesPagina) {
          (agrupadas[variante.producto_id] ??= []).push(variante);
        }

        setProductos(productosPagina);
        setTotalProductos(total);
        setVariantes(agrupadas);
        setVarianteSeleccionada({});
      } catch (error) {
        if (!componenteActivo) return;
        console.error("Error cargando productos:", error);
        setProductos([]);
        setVariantes({});
        setTotalProductos(0);
        setErrorProductos(
          "No fue posible cargar los productos en este momento."
        );
      } finally {
        if (componenteActivo) setCargando(false);
      }
    }

    cargarProductos();

    return () => {
      componenteActivo = false;
    };
  }, [categoria, subcategoriaId, busqueda, modoOfertas, paginaActual]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA)
  );
  const paginaMostrada = Math.min(paginaActual, totalPaginas);
  const indiceInicial = (paginaMostrada - 1) * PRODUCTOS_POR_PAGINA;
  const inicioBotones = Math.max(
    1,
    Math.min(paginaMostrada - 2, totalPaginas - 4)
  );
  const paginasVisibles = Array.from(
    {
      length: Math.min(5, totalPaginas),
    },
    (_, indice) => inicioBotones + indice
  );

  useEffect(() => {
    if (!imagenAmpliada) return;

    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setImagenAmpliada(null);
    };

    document.addEventListener("keydown", cerrarConEscape);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = overflowAnterior;
    };
  }, [imagenAmpliada]);

  function cambiarPagina(nuevaPagina: number) {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > totalPaginas ||
      nuevaPagina === paginaMostrada
    ) {
      return;
    }

    setPaginaActual(nuevaPagina);
    setImagenAmpliada(null);

    window.requestAnimationFrame(() => {
      document.getElementById("productos")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  /*
  |--------------------------------------------------------------------------
  | AGREGAR AL CARRITO
  |--------------------------------------------------------------------------
  |
  | Ahora enviamos al carrito:
  |
  | - ID
  | - nombre
  | - precio
  | - imagen
  | - si controla stock
  | - stock disponible
  |
  | De esta manera CartContext puede impedir que visualmente
  | se agreguen más unidades de las disponibles.
  |
  | IMPORTANTE:
  | El servidor sigue siendo la autoridad final sobre el stock.
  |
  */

  function agregarAlCarrito(
    producto: ProductoSupabase
  ) {
    const opciones = variantes[producto.id] ?? [];
    const variante = opciones.find(
      (opcion) => opcion.id === varianteSeleccionada[producto.id]
    );

    if (opciones.length > 0 && !variante) return;

    if (variante) {
      if (variante.controla_stock && variante.stock <= 0) return;

      agregarProducto({
        id: producto.id,
        varianteId: variante.id,
        varianteNombre: variante.nombre,
        varianteColor: variante.color ?? undefined,
        varianteTalla: variante.talla ?? undefined,
        sku: variante.sku,
        nombre: producto.nombre,
        precio: variante.precio ?? producto.precio,
        precioMayorista: variante.precio_mayorista ?? producto.precio_mayorista ?? undefined,
        cantidadMinimaMayorista: variante.cantidad_minima_mayorista ?? producto.cantidad_minima_mayorista ?? undefined,
        imagen: variante.imagen_url ?? producto.imagen_url ?? undefined,
        controlaStock: variante.controla_stock,
        stock: variante.stock,
      });
      return;
    }

    if (
      producto.controla_stock &&
      producto.stock <= 0
    ) {
      return;
    }

    agregarProducto({
      id: producto.id,
      sku: producto.sku ?? undefined,

      nombre:
        producto.nombre,

      precio:
        producto.precio,

      precioMayorista: producto.venta_mayorista ? producto.precio_mayorista ?? undefined : undefined,
      cantidadMinimaMayorista: producto.venta_mayorista ? producto.cantidad_minima_mayorista ?? undefined : undefined,

      imagen:
        producto.imagen_url ??
        undefined,

      controlaStock:
        producto.controla_stock,

      stock:
        producto.stock,
    });
  }

  function abrirVistaProducto(
    producto: ProductoSupabase,
    variante: VarianteProducto | undefined,
    imagen: string
  ) {
    const precio = variante?.precio ?? producto.precio;
    const esGrupo = !variante && (variantes[producto.id]?.length ?? 0) > 0;
    const contentId = getMetaContentId({
      id: producto.id,
      varianteId: variante?.id,
      sku: variante?.sku ?? producto.sku,
    });

    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_type: esGrupo ? "product_group" : "product",
      contents: [{ id: contentId, quantity: 1, item_price: precio }],
      currency: "COP",
      value: precio,
      content_name: producto.nombre,
      num_items: 1,
    });

    setImagenAmpliada({ url: imagen, nombre: producto.nombre });
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFAZ
  |--------------------------------------------------------------------------
  */

  return (
    <section
      id="productos"
      className="relative scroll-mt-40 overflow-hidden bg-[#080a08] px-4 py-12 text-white sm:px-6 sm:py-16 lg:py-20"
    >
      {/* Iluminación decorativa */}

      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#82f000]/5 blur-[130px]" />

      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#82f000]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}

        <div className="mb-8 sm:mb-12">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
              {busqueda
                ? "Resultados de búsqueda"
                : subcategoriaNombre
                ? `Subcategoría ${subcategoriaNombre}`
                : categoria
                ? `Categoría ${categoria}`
                : modoOfertas
                  ? "Precios especiales"
                  : "Lo que más se mueve"}
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {busqueda
                ? `Resultados para “${busqueda}”`
                : subcategoriaNombre && categoria
                ? `${subcategoriaNombre} en ${categoria}`
                : categoria
                ? `Productos de ${categoria}`
                : modoOfertas
                  ? "Ofertas"
                  : "Productos destacados"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
              {busqueda
                ? "Productos visibles que coinciden con tu búsqueda."
                : subcategoriaNombre && categoria
                ? `Explora los productos disponibles en ${subcategoriaNombre}, dentro de ${categoria}.`
                : categoria
                ? `Explora todos los productos disponibles de ${categoria}.`
                : modoOfertas
                ? "Aquí aparecen únicamente los productos marcados como oferta."
                : "Productos útiles, accesibles y pensados para resolver necesidades del día a día."}
            </p>
          </div>

        </div>

        {/* Cargando */}

        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#82f000]" />

            <p className="mt-4 text-sm text-white/45">
              Cargando productos...
            </p>
          </div>
        )}

        {/* Error */}

        {!cargando &&
          errorProductos !== "" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-10 text-center">
              <p className="font-semibold text-red-300">
                No pudimos cargar el
                catálogo.
              </p>

              <p className="mt-2 text-sm text-white/40">
                Intenta nuevamente dentro
                de unos momentos.
              </p>
            </div>
          )}

        {/* Sin productos */}

        {!cargando &&
          errorProductos === "" &&
          productos.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <div className="text-5xl">
                📦
              </div>

              <p className="mt-4 font-semibold">
                {busqueda
                  ? `No encontramos productos para “${busqueda}”.`
                  : subcategoriaNombre
                  ? `Todavía no hay productos disponibles en ${subcategoriaNombre}.`
                  : categoria
                  ? `Todavía no hay productos disponibles en ${categoria}.`
                  : modoOfertas
                  ? "Todavía no hay ofertas disponibles."
                  : "Todavía no hay productos disponibles."}
              </p>

              <p className="mt-2 text-sm text-white/40">
                {busqueda
                  ? "Prueba con otro nombre, referencia o categoría."
                  : subcategoriaNombre
                  ? "Puedes volver a “Todos” o elegir otra subcategoría."
                  : categoria
                  ? "Los productos visibles de esta categoría aparecerán aquí automáticamente."
                  : modoOfertas
                  ? "Cuando marques un producto como oferta, aparecerá aquí automáticamente."
                  : "Cuando marques un producto como destacado, aparecerá aquí automáticamente."}
              </p>
            </div>
          )}

        {/* Productos */}

        {!cargando &&
          errorProductos === "" &&
          productos.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {productos.map((producto) => {
                  const opciones = variantes[producto.id] ?? [];
                  const variante = opciones.find(
                    (opcion) => opcion.id === varianteSeleccionada[producto.id]
                  );
                  const requiereSeleccion = opciones.length > 0 && !variante;
                  const tieneColores = opciones.some((opcion) => Boolean(opcion.color));
                  const etiqueta =
                    obtenerEtiqueta(
                      producto
                    );

                  const sinStock = variante
                    ? variante.controla_stock && variante.stock <= 0
                    : opciones.length > 0
                      ? opciones.every((opcion) => opcion.controla_stock && opcion.stock <= 0)
                      : producto.controla_stock && producto.stock <= 0;

                  const precioVisible = variante?.precio ?? producto.precio;
                  const precioMayoristaVisible = variante?.precio_mayorista ?? producto.precio_mayorista;
                  const minimoMayoristaVisible = variante?.cantidad_minima_mayorista ?? producto.cantidad_minima_mayorista;
                  const imagenVisible = variante?.imagen_url ?? producto.imagen_url;
                  const stockVisible = variante?.stock ?? producto.stock;
                  const controlaStockVisible = variante?.controla_stock ?? producto.controla_stock;

                  return (
                    <article
                      key={producto.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all duration-300 hover:-translate-y-1 hover:border-[#82f000]/45 hover:bg-white/[0.05]"
                    >
                      {/* Imagen */}

                      <div className="relative flex h-52 items-center justify-center border-b border-white/[0.07] bg-gradient-to-br from-white/[0.055] to-transparent sm:h-56">
                        {etiqueta !==
                          "" && (
                          <span
                            className={
                              producto.en_oferta
                                ? "absolute left-4 top-4 rounded-full bg-orange-500/15 px-3 py-1.5 text-[11px] font-bold text-orange-400"
                                : "absolute left-4 top-4 rounded-full bg-[#82f000]/10 px-3 py-1.5 text-[11px] font-bold text-[#9cff35]"
                            }
                          >
                            {
                              etiqueta
                            }
                          </span>
                        )}

                        {sinStock && (
                          <span className="absolute bottom-4 left-4 rounded-full bg-red-500/15 px-3 py-1.5 text-[11px] font-bold text-red-300">
                            Agotado
                          </span>
                        )}

                        {imagenVisible ? (
                          <>
                            <img
                              src={imagenVisible}
                              alt={producto.nombre}
                              className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                abrirVistaProducto(producto, variante, imagenVisible)
                              }
                              aria-label={`Ver imagen ampliada de ${producto.nombre}`}
                              title="Ver imagen"
                              className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur transition hover:border-[#82f000] hover:bg-[#82f000] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#82f000]"
                            >
                              <EyeIcon />
                            </button>
                          </>
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#82f000]/[0.055] text-7xl transition duration-300 group-hover:scale-105 group-hover:bg-[#82f000]/10">
                            {obtenerIconoCategoria(
                              producto.categoria
                            )}
                          </div>
                        )}
                      </div>

                      {/* Información */}

                      <div className="p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#82f000]/70">
                          {
                            producto.categoria
                          }
                        </p>

                        <h3 className="mt-2 min-h-[52px] text-lg font-semibold leading-6">
                          {
                            producto.nombre
                          }
                        </h3>

                        {producto.descripcion && (
                          <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-white/35">
                            {
                              producto.descripcion
                            }
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-end gap-3">
                          <span className="break-words text-2xl font-bold">
                            {formatoPesos(
                              precioVisible
                            )}
                          </span>

                          {producto.precio_anterior !==
                            null &&
                            producto.precio_anterior >
                              precioVisible && (
                              <span className="pb-1 text-sm text-white/30 line-through">
                                {formatoPesos(
                                  producto.precio_anterior
                                )}
                              </span>
                            )}
                        </div>

                        {producto.venta_mayorista && precioMayoristaVisible !== null && minimoMayoristaVisible !== null && (
                          <div className="mt-3 rounded-xl border border-[#82f000]/20 bg-[#82f000]/[0.06] px-3 py-2.5">
                            <p className="text-xs font-bold text-[#9cff35]">
                              Mayorista: {formatoPesos(precioMayoristaVisible)} c/u
                            </p>
                            <p className="mt-1 text-[11px] text-white/40">Desde {minimoMayoristaVisible} unidades de esta opción</p>
                          </div>
                        )}

                        {opciones.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold text-white/55">
                              {tieneColores ? "Elige un color" : "Elige una opción"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {opciones.map((opcion) => {
                                const agotada = opcion.controla_stock && opcion.stock <= 0;
                                const activa = opcion.id === variante?.id;
                                const etiquetaOpcion = opcion.color ? opcion.nombre : `${opcion.nombre}${opcion.talla ? ` · ${opcion.talla}` : ""}`;

                                if (opcion.color) {
                                  return (
                                    <button
                                      key={opcion.id}
                                      type="button"
                                      disabled={agotada}
                                      aria-label={`${etiquetaOpcion}${agotada ? ", agotado" : ""}`}
                                      title={`${etiquetaOpcion}${agotada ? " · Agotado" : ""}`}
                                      onClick={() => setVarianteSeleccionada((actual) => ({ ...actual, [producto.id]: opcion.id }))}
                                      className={
                                        "relative h-11 w-11 rounded-full border-2 p-1 transition " +
                                        (agotada
                                          ? "cursor-not-allowed border-white/10 opacity-35"
                                          : activa
                                            ? "scale-110 border-[#82f000] shadow-[0_0_0_3px_rgba(130,240,0,0.2)]"
                                            : "cursor-pointer border-white/30 hover:scale-105 hover:border-white/70")
                                      }
                                    >
                                      <span className="block h-full w-full rounded-full border border-black/20" style={{ backgroundColor: muestraColor(opcion.color) }} />
                                      {agotada && <span className="absolute left-1/2 top-1/2 h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-400" />}
                                      {activa && !agotada && <span className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#82f000]" />}
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={opcion.id}
                                    type="button"
                                    disabled={agotada}
                                    onClick={() => setVarianteSeleccionada((actual) => ({ ...actual, [producto.id]: opcion.id }))}
                                    className={
                                      "rounded-lg border px-3 py-2 text-xs font-semibold transition " +
                                      (agotada
                                        ? "cursor-not-allowed border-white/5 text-white/20 line-through"
                                        : activa
                                          ? "border-[#82f000] bg-[#82f000]/10 text-[#9cff35]"
                                          : "cursor-pointer border-white/15 text-white/65 hover:border-[#82f000]/50")
                                    }
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{etiquetaOpcion}</span>
                                      {agotada && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-300 no-underline">Agotado</span>}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Stock */}

                        {requiereSeleccion ? (
                          <p className="mt-3 text-xs font-semibold text-[#9cff35]">
                            Selecciona {tieneColores ? "un color" : "una opción"} para continuar.
                          </p>
                        ) : controlaStockVisible && (
                          <p
                            className={
                              "mt-3 text-xs font-medium " +
                              (sinStock
                                ? "text-red-300"
                                : stockVisible <=
                                    5
                                  ? "text-orange-300"
                                  : "text-white/40")
                            }
                          >
                            {sinStock
                              ? "Producto agotado"
                              : stockVisible <=
                                  5
                                ? `Solo quedan ${stockVisible} unidades`
                                : `Stock disponible: ${stockVisible} unidades`}
                          </p>
                        )}

                        {/* Agregar al carrito */}

                        <button
                          type="button"
                          disabled={
                            sinStock || requiereSeleccion
                          }
                          onClick={() =>
                            agregarAlCarrito(
                              producto
                            )
                          }
                          className={
                            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition " +
                            (sinStock || requiereSeleccion
                              ? "cursor-not-allowed bg-white/10 text-white/30"
                              : "cursor-pointer bg-[#82f000] text-black hover:bg-[#9cff35]")
                          }
                        >
                          <CartIcon />

                          {sinStock
                            ? "Sin disponibilidad"
                            : requiereSeleccion
                              ? `Elige ${tieneColores ? "un color" : "una opción"}`
                              : "Agregar al carrito"}
                        </button>

                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPaginas > 1 && (
                <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-5 sm:flex-row sm:px-6">
                  <p className="text-center text-sm text-white/50 sm:text-left">
                    Mostrando{" "}
                    <strong className="text-white/80">
                      {indiceInicial + 1}–
                      {Math.min(
                        indiceInicial + PRODUCTOS_POR_PAGINA,
                      totalProductos
                      )}
                    </strong>{" "}
                    de{" "}
                    <strong className="text-white/80">
                      {totalProductos}
                    </strong>{" "}
                    productos
                  </p>

                  <nav
                    aria-label="Paginación de productos"
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <button
                      type="button"
                      disabled={paginaMostrada === 1}
                      onClick={() => cambiarPagina(paginaMostrada - 1)}
                      className="min-h-11 rounded-xl border border-white/15 px-3 text-sm font-bold text-white transition hover:border-[#82f000]/60 hover:text-[#9cff35] disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
                    >
                      ← Anterior
                    </button>

                    {paginasVisibles.map((pagina) => (
                      <button
                        key={pagina}
                        type="button"
                        aria-label={`Ir a la página ${pagina}`}
                        aria-current={
                          pagina === paginaMostrada ? "page" : undefined
                        }
                        onClick={() => cambiarPagina(pagina)}
                        className={
                          "h-11 min-w-11 rounded-xl border px-3 text-sm font-black transition " +
                          (pagina === paginaMostrada
                            ? "border-[#82f000] bg-[#82f000] text-black"
                            : "border-white/15 text-white/65 hover:border-[#82f000]/60 hover:text-[#9cff35]")
                        }
                      >
                        {pagina}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={paginaMostrada === totalPaginas}
                      onClick={() => cambiarPagina(paginaMostrada + 1)}
                      className="min-h-11 rounded-xl border border-white/15 px-3 text-sm font-bold text-white transition hover:border-[#82f000]/60 hover:text-[#9cff35] disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
                    >
                      Siguiente →
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}

        {imagenAmpliada && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada de ${imagenAmpliada.nombre}`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 backdrop-blur-sm sm:p-8"
            onClick={() => setImagenAmpliada(null)}
          >
            <div
              className="relative flex max-h-full w-full max-w-5xl items-center justify-center rounded-xl border border-white/15 bg-[#111411] p-2 shadow-2xl sm:rounded-2xl sm:p-8"
              onClick={(evento) => evento.stopPropagation()}
            >
              <img
                src={imagenAmpliada.url}
                alt={imagenAmpliada.nombre}
                className="max-h-[82vh] max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setImagenAmpliada(null)}
                aria-label="Cerrar vista ampliada"
                title="Cerrar"
                className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/75 text-2xl text-white transition hover:border-[#82f000] hover:bg-[#82f000] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#82f000]"
              >
                ×
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| ICONO CARRITO
|--------------------------------------------------------------------------
*/

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2-1.6L21 7H6" />

      <circle
        cx="9"
        cy="20"
        r="1"
      />

      <circle
        cx="18"
        cy="20"
        r="1"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
