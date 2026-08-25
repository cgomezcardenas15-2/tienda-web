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

      const { data, error } =
        await supabase
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
          });

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
      className="relative overflow-hidden bg-[#080a08] px-6 py-20 text-white"
    >
      {/* Iluminación decorativa */}

      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#82f000]/5 blur-[130px]" />

      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#82f000]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}

        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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

          <button
            type="button"
            className="w-fit cursor-pointer text-sm font-semibold text-white/60 transition hover:text-[#82f000]"
          >
            Ver todos →
          </button>
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
                  const etiqueta =
                    obtenerEtiqueta(
                      producto
                    );

                  const sinStock =
                    producto.controla_stock &&
                    producto.stock <= 0;

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

                        {/* Favoritos */}

                        <button
                          type="button"
                          aria-label={
                            "Agregar " +
                            producto.nombre +
                            " a favoritos"
                          }
                          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/20 text-xl text-white/50 transition hover:border-[#82f000]/40 hover:text-[#82f000]"
                        >
                          ♡
                        </button>

                        {producto.imagen_url ? (
                          <img
                            src={
                              producto.imagen_url
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
                              producto.precio
                            )}
                          </span>

                          {producto.precio_anterior !==
                            null &&
                            producto.precio_anterior >
                              producto.precio && (
                              <span className="pb-1 text-sm text-white/30 line-through">
                                {formatoPesos(
                                  producto.precio_anterior
                                )}
                              </span>
                            )}
                        </div>

                        {/* Stock */}

                        {producto.controla_stock && (
                          <p
                            className={
                              "mt-3 text-xs font-medium " +
                              (sinStock
                                ? "text-red-300"
                                : producto.stock <=
                                    5
                                  ? "text-orange-300"
                                  : "text-white/40")
                            }
                          >
                            {sinStock
                              ? "Producto agotado"
                              : producto.stock <=
                                  5
                                ? `Solo quedan ${producto.stock} unidades`
                                : `Stock disponible: ${producto.stock} unidades`}
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

                        {/* Ayuda */}

                        <button
                          type="button"
                          className="mt-3 w-full cursor-pointer text-center text-xs font-medium text-white/35 transition hover:text-[#82f000]"
                        >
                          ¿Necesitas ayuda
                          para elegir?
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}

        {/* Guía NOVA */}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-sm font-semibold">
              ¿No encuentras exactamente lo
              que necesitas?
            </p>

            <p className="mt-1 text-xs text-white/40">
              Un Guía NOVA puede ayudarte a
              encontrar una opción adecuada.
            </p>
          </div>

          <button
            type="button"
            className="cursor-pointer text-sm font-semibold text-[#82f000] transition hover:text-[#9cff35]"
          >
            Hablar con un Guía NOVA →
          </button>
        </div>
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