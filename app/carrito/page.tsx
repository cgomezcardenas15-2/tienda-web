"use client";

import {
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  useCart,
} from "../context/CartContext";

/*
|--------------------------------------------------------------------------
| FORMATO DE PESOS
|--------------------------------------------------------------------------
*/

function formatoPesos(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(valor);
}

/*
|--------------------------------------------------------------------------
| PÁGINA DEL CARRITO
|--------------------------------------------------------------------------
*/

export default function CarritoPage() {
  const {
    items,
    subtotal,

    aumentarCantidad,
    disminuirCantidad,

    quitarProducto,
    vaciarCarrito,
  } = useCart();

  /*
  |--------------------------------------------------------------------------
  | MENSAJE TEMPORAL DE STOCK
  |--------------------------------------------------------------------------
  |
  | Guarda el ID del producto cuyo límite de stock intentó superar
  | el cliente.
  |
  */

  const [
    productoConAvisoStock,
    setProductoConAvisoStock,
  ] = useState<string | null>(
    null
  );

  const carritoVacio =
    items.length === 0;

  /*
  |--------------------------------------------------------------------------
  | OCULTAR AVISO AUTOMÁTICAMENTE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      productoConAvisoStock ===
      null
    ) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setProductoConAvisoStock(
          null
        );
      }, 3500);

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [
    productoConAvisoStock,
  ]);

  /*
  |--------------------------------------------------------------------------
  | INTENTAR AUMENTAR CANTIDAD
  |--------------------------------------------------------------------------
  |
  | CartContext sigue controlando el límite.
  |
  | Aquí agregamos una mejora visual:
  | si el cliente ya llegó al stock disponible, mostramos un aviso.
  |
  */

  function manejarAumento(
    id: string
  ) {
    const producto =
      items.find(
        (item) =>
          item.id === id
      );

    if (!producto) {
      return;
    }

    const tieneControlStock =
      producto.controlaStock ===
      true;

    const stockValido =
      typeof producto.stock ===
        "number" &&
      Number.isFinite(
        producto.stock
      );

    if (
      tieneControlStock &&
      stockValido &&
      producto.cantidad >=
        producto.stock!
    ) {
      /*
      | Si el mismo producto ya tenía
      | el aviso visible, lo reiniciamos.
      */

      setProductoConAvisoStock(
        null
      );

      window.setTimeout(
        () => {
          setProductoConAvisoStock(
            id
          );
        },
        10
      );

      return;
    }

    /*
    | Todavía hay disponibilidad.
    */

    setProductoConAvisoStock(
      null
    );

    aumentarCantidad(id);
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFAZ
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] px-6 py-14 text-white lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Encabezado */}

          <div className="mb-10">
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              Tu compra
            </span>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Carrito
            </h1>

            <p className="mt-3 max-w-2xl text-white/50">
              Revisa tus productos,
              ajusta cantidades y
              continúa cuando estés
              listo.
            </p>
          </div>

          {carritoVacio ? (
            /*
            |--------------------------------------------------------------------------
            | CARRITO VACÍO
            |--------------------------------------------------------------------------
            */

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-3xl">
                🛒
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                Tu carrito está vacío
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
                Cuando agregues
                productos desde NOVA
                aparecerán aquí para que
                puedas revisar tu compra.
              </p>

              <a
                href="/#productos"
                className="mt-7 inline-flex cursor-pointer rounded-xl bg-[#82f000] px-6 py-3 font-bold text-black transition hover:bg-[#9cff35]"
              >
                Ver productos
              </a>
            </section>
          ) : (
            /*
            |--------------------------------------------------------------------------
            | CARRITO CON PRODUCTOS
            |--------------------------------------------------------------------------
            */

            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Lista de productos */}

              <section className="space-y-4">
                {items.map(
                  (item) => {
                    const controlaStock =
                      item.controlaStock ===
                      true;

                    const stockDisponible =
                      typeof item.stock ===
                        "number" &&
                      Number.isFinite(
                        item.stock
                      )
                        ? Math.max(
                            0,
                            Math.floor(
                              item.stock
                            )
                          )
                        : undefined;

                    const alcanzoLimite =
                      controlaStock &&
                      stockDisponible !==
                        undefined &&
                      item.cantidad >=
                        stockDisponible;

                    const mostrarAviso =
                      productoConAvisoStock ===
                      item.id;

                    return (
                      <article
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                      >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                          {/* Imagen */}

                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                            {item.imagen ? (
                              <img
                                src={
                                  item.imagen
                                }
                                alt={
                                  item.nombre
                                }
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <span className="text-3xl">
                                🛍️
                              </span>
                            )}
                          </div>

                          {/* Información */}

                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold">
                              {
                                item.nombre
                              }
                            </h2>

                            <p className="mt-2 text-xl font-bold text-[#82f000]">
                              {formatoPesos(
                                item.precio
                              )}
                            </p>

                            {controlaStock &&
                              stockDisponible !==
                                undefined && (
                                <p
                                  className={
                                    "mt-2 text-xs font-medium " +
                                    (stockDisponible <=
                                    5
                                      ? "text-orange-300"
                                      : "text-white/35")
                                  }
                                >
                                  {stockDisponible ===
                                  0
                                    ? "Sin unidades disponibles"
                                    : `Stock disponible: ${stockDisponible} ${
                                        stockDisponible ===
                                        1
                                          ? "unidad"
                                          : "unidades"
                                      }`}
                                </p>
                              )}
                          </div>

                          {/* Controles */}

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/20">
                              <button
                                type="button"
                                onClick={() => {
                                  setProductoConAvisoStock(
                                    null
                                  );

                                  disminuirCantidad(
                                    item.id
                                  );
                                }}
                                className="h-10 w-10 cursor-pointer text-lg text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                aria-label={
                                  "Disminuir cantidad de " +
                                  item.nombre
                                }
                              >
                                −
                              </button>

                              <span className="flex h-10 min-w-12 items-center justify-center border-x border-white/10 px-3 font-semibold">
                                {
                                  item.cantidad
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  manejarAumento(
                                    item.id
                                  )
                                }
                                className={
                                  "h-10 w-10 text-lg transition " +
                                  (alcanzoLimite
                                    ? "cursor-pointer text-white/30 hover:bg-orange-400/[0.06] hover:text-orange-300"
                                    : "cursor-pointer text-white/70 hover:bg-white/[0.06] hover:text-white")
                                }
                                aria-label={
                                  "Aumentar cantidad de " +
                                  item.nombre
                                }
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setProductoConAvisoStock(
                                  null
                                );

                                quitarProducto(
                                  item.id
                                );
                              }}
                              className="cursor-pointer rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {/* Aviso de límite */}

                        {mostrarAviso &&
                          stockDisponible !==
                            undefined && (
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-400/20 bg-orange-400/[0.06] px-4 py-3">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400/10 text-xs">
                                !
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-orange-200">
                                  Alcanzaste
                                  la cantidad
                                  disponible
                                </p>

                                <p className="mt-1 text-xs leading-5 text-white/45">
                                  Lo
                                  sentimos,
                                  por el
                                  momento
                                  solo
                                  tenemos{" "}
                                  <span className="font-semibold text-white/70">
                                    {
                                      stockDisponible
                                    }{" "}
                                    {stockDisponible ===
                                    1
                                      ? "unidad"
                                      : "unidades"}
                                  </span>{" "}
                                  de este
                                  producto.
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Subtotal */}

                        <div className="mt-5 border-t border-white/[0.07] pt-4 text-right">
                          <span className="text-sm text-white/35">
                            Subtotal del
                            producto:
                          </span>

                          <span className="ml-2 font-bold">
                            {formatoPesos(
                              item.precio *
                                item.cantidad
                            )}
                          </span>
                        </div>
                      </article>
                    );
                  }
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProductoConAvisoStock(
                      null
                    );

                    vaciarCarrito();
                  }}
                  className="cursor-pointer text-sm font-semibold text-white/40 transition hover:text-red-400"
                >
                  Vaciar carrito
                </button>
              </section>

              {/* Resumen */}

              <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-36">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                  Resumen
                </span>

                <h2 className="mt-3 text-2xl font-semibold">
                  Tu pedido
                </h2>

                <div className="mt-6 space-y-4 border-b border-white/[0.08] pb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/45">
                      Subtotal
                    </span>

                    <span className="font-semibold">
                      {formatoPesos(
                        subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/45">
                      Envío
                    </span>

                    <span className="text-white/60">
                      Por calcular
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <span className="text-sm text-white/50">
                    Total provisional
                  </span>

                  <span className="text-3xl font-bold text-[#82f000]">
                    {formatoPesos(
                      subtotal
                    )}
                  </span>
                </div>

                <a
                  href="/checkout"
                  className="mt-7 flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#82f000] px-5 py-3.5 font-bold text-black transition hover:bg-[#9cff35]"
                >
                  Continuar compra
                </a>

                <p className="mt-4 text-center text-xs leading-5 text-white/30">
                  El valor final del
                  envío se calculará
                  antes de confirmar el
                  pedido.
                </p>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}