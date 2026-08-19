"use client";

import { useCart } from "../context/CartContext";

const productos = [
  {
    id: "cable-usbc",
    nombre: "Cable USB-C Carga Rápida",
    categoria: "Tecnología",
    precio: 14900,
    precioTexto: "$14.900",
    precioAnterior: "$19.900",
    icono: "🔌",
    etiqueta: "Más vendido",
    oferta: false,
  },
  {
    id: "cargador-usb-20w",
    nombre: "Cargador USB 20W",
    categoria: "Tecnología",
    precio: 24900,
    precioTexto: "$24.900",
    precioAnterior: "$32.900",
    icono: "⚡",
    etiqueta: "Oferta",
    oferta: true,
  },
  {
    id: "audifonos-bluetooth",
    nombre: "Audífonos Bluetooth",
    categoria: "Tecnología",
    precio: 29900,
    precioTexto: "$29.900",
    precioAnterior: "",
    icono: "🎧",
    etiqueta: "Popular",
    oferta: false,
  },
  {
    id: "soporte-celular",
    nombre: "Soporte para Celular",
    categoria: "Tecnología",
    precio: 12900,
    precioTexto: "$12.900",
    precioAnterior: "",
    icono: "📱",
    etiqueta: "",
    oferta: false,
  },
  {
    id: "bombillo-led-12w",
    nombre: "Bombillo LED 12W",
    categoria: "Hogar",
    precio: 9900,
    precioTexto: "$9.900",
    precioAnterior: "$12.900",
    icono: "💡",
    etiqueta: "Oferta",
    oferta: true,
  },
  {
    id: "organizador-multiuso",
    nombre: "Organizador Multiuso",
    categoria: "Hogar",
    precio: 18900,
    precioTexto: "$18.900",
    precioAnterior: "",
    icono: "🧺",
    etiqueta: "Nuevo",
    oferta: false,
  },
  {
    id: "juguete-mascota",
    nombre: "Juguete para Mascota",
    categoria: "Mascotas",
    precio: 11900,
    precioTexto: "$11.900",
    precioAnterior: "",
    icono: "🐾",
    etiqueta: "",
    oferta: false,
  },
  {
    id: "kit-destornilladores",
    nombre: "Kit de Destornilladores",
    categoria: "Ferretería",
    precio: 21900,
    precioTexto: "$21.900",
    precioAnterior: "$27.900",
    icono: "🔧",
    etiqueta: "Oferta",
    oferta: true,
  },
];

export default function Products() {
  const { agregarProducto } = useCart();

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
              Productos útiles, accesibles y pensados para resolver necesidades
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

        {/* Productos */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productos.map((producto) => (
            <article
              key={producto.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition-all duration-300 hover:-translate-y-1 hover:border-[#82f000]/45 hover:bg-white/[0.05]"
            >
              {/* Imagen / icono temporal */}
              <div className="relative flex h-56 items-center justify-center border-b border-white/[0.07] bg-gradient-to-br from-white/[0.055] to-transparent">
                {producto.etiqueta !== "" && (
                  <span
                    className={
                      producto.oferta
                        ? "absolute left-4 top-4 rounded-full bg-orange-500/15 px-3 py-1.5 text-[11px] font-bold text-orange-400"
                        : "absolute left-4 top-4 rounded-full bg-[#82f000]/10 px-3 py-1.5 text-[11px] font-bold text-[#9cff35]"
                    }
                  >
                    {producto.etiqueta}
                  </span>
                )}

                {/* Favoritos */}
                <button
                  type="button"
                  aria-label={"Agregar " + producto.nombre + " a favoritos"}
                  className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/20 text-xl text-white/50 transition hover:border-[#82f000]/40 hover:text-[#82f000]"
                >
                  ♡
                </button>

                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#82f000]/[0.055] text-7xl transition duration-300 group-hover:scale-105 group-hover:bg-[#82f000]/10">
                  {producto.icono}
                </div>
              </div>

              {/* Información */}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#82f000]/70">
                  {producto.categoria}
                </p>

                <h3 className="mt-2 min-h-[52px] text-lg font-semibold leading-6">
                  {producto.nombre}
                </h3>

                <div className="mt-4 flex items-end gap-3">
                  <span className="text-2xl font-bold">
                    {producto.precioTexto}
                  </span>

                  {producto.precioAnterior !== "" && (
                    <span className="pb-1 text-sm text-white/30 line-through">
                      {producto.precioAnterior}
                    </span>
                  )}
                </div>

                {/* Agregar al carrito */}
                <button
                  type="button"
                  onClick={() =>
                    agregarProducto({
                      id: producto.id,
                      nombre: producto.nombre,
                      precio: producto.precio,
                    })
                  }
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#82f000] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#9cff35]"
                >
                  <CartIcon />
                  Agregar al carrito
                </button>

                {/* Ayuda */}
                <button
                  type="button"
                  className="mt-3 w-full cursor-pointer text-center text-xs font-medium text-white/35 transition hover:text-[#82f000]"
                >
                  ¿Necesitas ayuda para elegir?
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Guía NOVA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-sm font-semibold">
              ¿No encuentras exactamente lo que necesitas?
            </p>

            <p className="mt-1 text-xs text-white/40">
              Un Guía NOVA puede ayudarte a encontrar una opción adecuada.
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
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}