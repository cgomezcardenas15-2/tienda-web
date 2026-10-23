"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  obtenerClaveCarrito,
  obtenerPrecioUnitario,
  useCart,
} from "../context/CartContext";

const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function MiniCart() {
  const {
    items,
    cantidadTotal,
    subtotal,
    miniCarritoAbierto,
    ultimaClaveAgregada,
    avisoMiniCarrito,
    cerrarMiniCarrito,
    aumentarCantidad,
    disminuirCantidad,
    quitarProducto,
  } = useCart();
  const pathname = usePathname();
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const elementoAnteriorRef = useRef<HTMLElement | null>(null);
  const rutaSinMiniCarrito =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pago");
  const estaVisible = miniCarritoAbierto && !rutaSinMiniCarrito;
  const itemsOrdenados = ultimaClaveAgregada
    ? [
        ...items.filter(
          (item) => obtenerClaveCarrito(item) === ultimaClaveAgregada
        ),
        ...items.filter(
          (item) => obtenerClaveCarrito(item) !== ultimaClaveAgregada
        ),
      ]
    : items;

  useEffect(() => {
    if (!estaVisible) return;

    const overflowAnterior = document.body.style.overflow;
    elementoAnteriorRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    botonCerrarRef.current?.focus();

    function controlarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        cerrarMiniCarrito();
        return;
      }

      if (evento.key !== "Tab" || !panelRef.current) return;

      const controles = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (controles.length === 0) return;

      const primero = controles[0];
      const ultimo = controles[controles.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", controlarTeclado);

    return () => {
      document.removeEventListener("keydown", controlarTeclado);
      document.body.style.overflow = overflowAnterior;
      elementoAnteriorRef.current?.focus();
    };
  }, [estaVisible, cerrarMiniCarrito]);

  if (!estaVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-end bg-black/75 backdrop-blur-sm sm:items-stretch"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrarMiniCarrito();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-carrito-titulo"
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#101310] text-white shadow-[0_-18px_70px_rgba(0,0,0,0.7)] sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl sm:shadow-[-24px_0_80px_rgba(0,0,0,0.65)]"
      >
        <div className="border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-xs font-black uppercase tracking-[0.18em] ${
                  avisoMiniCarrito === "limite"
                    ? "text-orange-300"
                    : "text-[#82f000]"
                }`}
              >
                {avisoMiniCarrito === "limite"
                  ? "Límite de existencias"
                  : "Agregado al carrito"}
              </p>
              <h2 id="mini-carrito-titulo" className="mt-1 text-2xl font-black">
                Tu carrito
              </h2>
              <p className="mt-1 text-sm text-white/45">
                {cantidadTotal} {cantidadTotal === 1 ? "producto" : "productos"} en tu compra
              </p>
            </div>

            <button
              ref={botonCerrarRef}
              type="button"
              onClick={cerrarMiniCarrito}
              aria-label="Cerrar mini carrito"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-2xl text-white/70 transition hover:border-[#82f000]/60 hover:bg-[#82f000]/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#82f000]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
          {items.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="text-5xl" aria-hidden="true">
                🛍️
              </span>
              <h3 className="mt-4 text-xl font-black">Tu carrito quedó vacío</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/45">
                Puedes cerrar esta ventana y seguir descubriendo productos.
              </p>
            </div>
          ) : itemsOrdenados.map((item) => {
            const clave = obtenerClaveCarrito(item);
            const esUltimo = clave === ultimaClaveAgregada;
            const precioUnitario = obtenerPrecioUnitario(item);
            const limiteStock =
              item.controlaStock === true &&
              typeof item.stock === "number" &&
              Number.isFinite(item.stock)
                ? Math.max(0, Math.floor(item.stock))
                : undefined;
            const llegoAlLimite =
              limiteStock !== undefined && item.cantidad >= limiteStock;

            return (
              <article
                key={clave}
                className={
                  "relative rounded-2xl border p-3.5 transition " +
                  (esUltimo
                    ? avisoMiniCarrito === "limite"
                      ? "border-orange-300/55 bg-orange-300/[0.07]"
                      : "border-[#82f000]/55 bg-[#82f000]/[0.07] shadow-[0_0_24px_rgba(130,240,0,0.08)]"
                    : "border-white/10 bg-white/[0.035]")
                }
              >
                {esUltimo && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide text-black ${
                      avisoMiniCarrito === "limite"
                        ? "bg-orange-300"
                        : "bg-[#82f000]"
                    }`}
                  >
                    {avisoMiniCarrito === "limite" ? "Ya estaba" : "Agregado"}
                  </span>
                )}

                <div className="flex gap-3 pr-1">
                  {item.imagen ? (
                    <div
                      role="img"
                      aria-label={item.nombre}
                      className="h-20 w-20 shrink-0 rounded-xl border border-white/10 bg-white bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${JSON.stringify(item.imagen)})` }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#82f000]/10 text-3xl" aria-hidden="true">
                      🛍️
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3
                      className={`break-words text-sm font-black leading-5 ${
                        esUltimo ? "pr-20" : "pr-2"
                      }`}
                    >
                      {item.nombre}
                    </h3>
                    {(item.varianteNombre || item.varianteColor || item.varianteTalla) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
                        {item.varianteColor && (
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/30"
                            style={{ backgroundColor: item.varianteColor }}
                            aria-hidden="true"
                          />
                        )}
                        <span>
                          {[item.varianteNombre, item.varianteTalla ? `Talla ${item.varianteTalla}` : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    )}
                    <p className="mt-2 text-base font-black text-[#9cff35]">
                      {formatoPesos.format(precioUnitario * item.cantidad)}
                    </p>
                    {item.cantidad > 1 && (
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {formatoPesos.format(precioUnitario)} por unidad
                      </p>
                    )}
                    {precioUnitario !== item.precio && (
                      <p className="mt-0.5 text-[11px] font-semibold text-[#82f000]/70">
                        Precio mayorista aplicado
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-white/15 bg-black/30">
                    <button
                      type="button"
                      onClick={() => disminuirCantidad(clave)}
                      aria-label={`Disminuir cantidad de ${item.nombre}`}
                      className="flex h-10 w-10 items-center justify-center text-xl font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      −
                    </button>
                    <span className="min-w-10 px-2 text-center text-sm font-black" aria-label={`Cantidad ${item.cantidad}`}>
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => aumentarCantidad(clave)}
                      disabled={llegoAlLimite}
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                      className="flex h-10 w-10 items-center justify-center text-xl font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => quitarProducto(clave)}
                    aria-label={`Quitar ${item.nombre} del carrito`}
                    className="min-h-10 rounded-lg px-3 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    Quitar
                  </button>
                </div>

                {llegoAlLimite && (
                  <p className="mt-2 text-[11px] font-semibold text-orange-300">
                    Ya agregaste todas las unidades disponibles.
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <div className="border-t border-white/10 bg-black/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          {items.length > 0 && (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/40">Subtotal</p>
                  <p className="mt-1 text-xs text-white/35">El envío se calcula después</p>
                </div>
                <p className="text-2xl font-black text-white">{formatoPesos.format(subtotal)}</p>
              </div>

              <div className="mt-4">
                <Link
                  href="/carrito"
                  onClick={cerrarMiniCarrito}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#82f000] px-4 text-center text-sm font-black text-black shadow-[0_10px_30px_rgba(130,240,0,0.18)] transition hover:bg-[#9cff35]"
                >
                  Ver carrito y continuar
                </Link>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={cerrarMiniCarrito}
            className={`${
              items.length > 0 ? "mt-3" : ""
            } min-h-10 w-full text-sm font-semibold text-white/55 transition hover:text-white`}
          >
            {items.length > 0 ? "Seguir comprando" : "Volver a la tienda"}
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {cantidadTotal > 0
            ? `Tu carrito tiene ${cantidadTotal} ${
                cantidadTotal === 1 ? "producto" : "productos"
              } y un subtotal de ${formatoPesos.format(subtotal)}.`
            : "Tu carrito está vacío."}
        </p>
      </aside>
    </div>
  );
}
