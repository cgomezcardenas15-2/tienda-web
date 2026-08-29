"use client";

import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
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
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
};

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

export default function Products() {
  const { agregarProducto } =
    useCart();

  const [productos, setProductos] =
    useState<ProductoSupabase[]>([]);

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

      const [resultadoProductos, resultadoVariantes] = await Promise.all([
        supabase
          .from("productos")
          .select(
            `
              id,
              sku,
              nombre,
              slug,
              descripcion,
              categoria,
              precio,
              precio_anterior,
              controla_stock,
              stock,
              imagen_url,
              destacado,
              en_oferta,
              activo
            `
          )
          .order("destacado", {
            ascending: false,
          })
          .order("creado_en", {
            ascending: false,
          }),
        supabase
          .from("variantes_producto")
          .select("id, producto_id, nombre, color, talla, sku, precio, controla_stock, stock, imagen_url, activo, orden")
          .eq("activo", true)
          .order("orden", { ascending: true }),
      ]);

      const { data, error } = resultadoProductos;

      if (!componenteActivo) {
        return;
      }

      if (error) {
        console.error(
          "Error cargando productos:",
          error
        );

        setProductos([]);

        setErrorProductos(
          "No fue posible cargar los productos en este momento."
        );

        setCargando(false);
        return;
      }

      setProductos(
        (data ??
          []) as ProductoSupabase[]
      );

      if (resultadoVariantes.error) {
        console.error("Error cargando variantes:", resultadoVariantes.error);
      } else {
        const agrupadas: Record<string, VarianteProducto[]> = {};
        for (const variante of (resultadoVariantes.data ?? []) as VarianteProducto[]) {
          (agrupadas[variante.producto_id] ??= []).push(variante);
        }
        setVariantes(agrupadas);
        setVarianteSeleccionada(
          Object.fromEntries(
            Object.entries(agrupadas).map(([productoId, opciones]) => [
              productoId,
              opciones.find((opcion) => !opcion.controla_stock || opcion.stock > 0)?.id ?? opciones[0]?.id,
            ])
          )
        );
      }

      setCargando(false);
    }

    cargarProductos();

    return () => {
      componenteActivo = false;
    };
  }, []);

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

      nombre:
        producto.nombre,

      precio:
        producto.precio,

      imagen:
        producto.imagen_url ??
        undefined,

      controlaStock:
        producto.controla_stock,

      stock:
        producto.stock,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFAZ
  |--------------------------------------------------------------------------
  */

  return (
    <section
      id="productos"
      className="relative scroll-mt-40 overflow-hidden bg-[#080a08] px-6 py-20 text-white"
    >
      {/* Iluminación decorativa */}

      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#82f000]/5 blur-[130px]" />

      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#82f000]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}

        <div className="mb-12">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
              Lo que más se mueve
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Productos destacados
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
              Productos útiles, accesibles y
              pensados para resolver necesidades
              del día a día.
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
                Todavía no hay productos
                disponibles.
              </p>

              <p className="mt-2 text-sm text-white/40">
                Los productos activos
                aparecerán aquí
                automáticamente.
              </p>
            </div>
          )}

        {/* Productos */}

        {!cargando &&
          errorProductos === "" &&
          productos.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {productos.map(
                (producto) => {
                  const opciones = variantes[producto.id] ?? [];
                  const variante = opciones.find(
                    (opcion) => opcion.id === varianteSeleccionada[producto.id]
                  );
                  const etiqueta =
                    obtenerEtiqueta(
                      producto
                    );

                  const sinStock = variante
                    ? variante.controla_stock && variante.stock <= 0
                    : producto.controla_stock && producto.stock <= 0;

                  const precioVisible = variante?.precio ?? producto.precio;
                  const imagenVisible = variante?.imagen_url ?? producto.imagen_url;
                  const stockVisible = variante?.stock ?? producto.stock;
                  const controlaStockVisible = variante?.controla_stock ?? producto.controla_stock;

                  return (
                    <article
                      key={producto.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all duration-300 hover:-translate-y-1 hover:border-[#82f000]/45 hover:bg-white/[0.05]"
                    >
                      {/* Imagen */}

                      <div className="relative flex h-56 items-center justify-center border-b border-white/[0.07] bg-gradient-to-br from-white/[0.055] to-transparent">
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
                          <img
                            src={
                              imagenVisible
                            }
                            alt={
                              producto.nombre
                            }
                            className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#82f000]/[0.055] text-7xl transition duration-300 group-hover:scale-105 group-hover:bg-[#82f000]/10">
                            {obtenerIconoCategoria(
                              producto.categoria
                            )}
                          </div>
                        )}
                      </div>

                      {/* Información */}

                      <div className="p-5">
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

                        <div className="mt-4 flex items-end gap-3">
                          <span className="text-2xl font-bold">
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

                        {opciones.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold text-white/55">
                              Elige una opción
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {opciones.map((opcion) => {
                                const agotada = opcion.controla_stock && opcion.stock <= 0;
                                const activa = opcion.id === variante?.id;
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
                                    {opcion.nombre}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Stock */}

                        {controlaStockVisible && (
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
                            sinStock
                          }
                          onClick={() =>
                            agregarAlCarrito(
                              producto
                            )
                          }
                          className={
                            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition " +
                            (sinStock
                              ? "cursor-not-allowed bg-white/10 text-white/30"
                              : "cursor-pointer bg-[#82f000] text-black hover:bg-[#9cff35]")
                          }
                        >
                          <CartIcon />

                          {sinStock
                            ? "Sin disponibilidad"
                            : "Agregar al carrito"}
                        </button>

                      </div>
                    </article>
                  );
                }
              )}
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
