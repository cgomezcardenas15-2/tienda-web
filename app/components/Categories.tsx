const categorias = [
  {
    nombre: "Piñatería",
    descripcion: "Todo para celebrar momentos especiales",
    icono: "🎉",
    href: "/categoria/pinateria",
  },
  {
    nombre: "Hogar",
    descripcion: "Productos prácticos para tu día a día",
    icono: "🏠",
    href: "/categoria/hogar",
  },
  {
    nombre: "Mascotas",
    descripcion: "Accesorios para consentirlos",
    icono: "🐾",
    href: "/categoria/mascotas",
  },
  {
    nombre: "Ofertas",
    descripcion: "Productos seleccionados a mejor precio",
    icono: "🔥",
    href: "/#productos",
    oferta: true,
  },
];

export default function Categories() {
  return (
    <section
      id="categorias"
      className="relative scroll-mt-40 overflow-hidden bg-[#0b0d0b] px-6 py-20 text-white"
    >
      {/* Iluminación decorativa */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#82f000]/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
              Explora NOVA
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Encuentra lo que necesitas
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
              Todo organizado de forma sencilla para que encuentres productos
              útiles, prácticos y de alta rotación en pocos segundos.
            </p>
          </div>

          <a
            href="/#productos"
            className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-[#82f000]"
          >
            Ver todos los productos
            <span className="transition group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* Tarjetas de categorías */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((categoria) => (
            <a
              key={categoria.nombre}
              href={categoria.href}
              className={`group relative block min-h-[205px] cursor-pointer overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                categoria.oferta
                  ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-white/[0.03] hover:border-orange-400/70"
                  : "border-white/10 bg-white/[0.035] hover:border-[#82f000]/60 hover:bg-[#82f000]/[0.055]"
              }`}
            >
              {/* Brillo decorativo */}
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300 ${
                  categoria.oferta
                    ? "bg-orange-500/10 group-hover:bg-orange-500/20"
                    : "bg-[#82f000]/5 group-hover:bg-[#82f000]/15"
                }`}
              />

              {/* Icono */}
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  categoria.oferta
                    ? "bg-orange-500/15"
                    : "bg-[#82f000]/10"
                }`}
              >
                {categoria.icono}
              </div>

              {/* Información */}
              <div className="relative mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`text-lg font-semibold transition ${
                      categoria.oferta
                        ? "group-hover:text-orange-400"
                        : "group-hover:text-[#82f000]"
                    }`}
                  >
                    {categoria.nombre}
                  </h3>

                  <span
                    className={`text-lg transition duration-300 group-hover:translate-x-1 ${
                      categoria.oferta
                        ? "text-orange-400"
                        : "text-[#82f000]"
                    }`}
                  >
                    →
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  {categoria.descripcion}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Frase inferior */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/[0.07] pt-8 text-xs text-white/40 sm:text-sm">
          <span>
            <span className="mr-2 text-[#82f000]">✓</span>
            Compra sencilla
          </span>

          <span>
            <span className="mr-2 text-[#82f000]">✓</span>
            Productos útiles
          </span>

          <span>
            <span className="mr-2 text-[#82f000]">✓</span>
            Todo en un solo lugar
          </span>
        </div>
      </div>
    </section>
  );
}
