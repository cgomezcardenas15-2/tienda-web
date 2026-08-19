export default function Benefits() {
  const beneficios = [
    {
      numero: "01",
      titulo: "Compra segura",
      descripcion:
        "Queremos que compres con tranquilidad. Información clara, procesos simples y acompañamiento cuando lo necesites.",
      icono: "✓",
    },
    {
      numero: "02",
      titulo: "Envíos confiables",
      descripcion:
        "Conoce el estado de tu pedido y recibe información clara durante todo el proceso de entrega.",
      icono: "→",
    },
    {
      numero: "03",
      titulo: "Guía NOVA",
      descripcion:
        "Si no sabes qué elegir o cómo continuar tu compra, una persona podrá acompañarte paso a paso.",
      icono: "◇",
      destacado: true,
    },
    {
      numero: "04",
      titulo: "Atención y respaldo",
      descripcion:
        "Queremos que siempre sepas dónde acudir si tienes una pregunta antes, durante o después de comprar.",
      icono: "+",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0b0d0b] px-6 py-24 text-white">
      {/* Luces ambientales */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#82f000]/5 blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#82f000]/5 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="grid gap-8 border-b border-white/[0.08] pb-12 lg:grid-cols-2 lg:items-end">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              La experiencia NOVA
            </span>

            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Comprar debería sentirse
              <span className="text-[#82f000]"> sencillo.</span>
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-white/45 sm:text-base lg:justify-self-end">
            Diseñamos NOVA para que encuentres lo que necesitas sin
            complicaciones y tengas ayuda disponible cuando realmente la
            necesites.
          </p>
        </div>

        {/* Beneficios */}
        <div className="grid border-b border-white/[0.08] md:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((beneficio) => (
            <article
              key={beneficio.numero}
              className={`group relative min-h-[290px] border-white/[0.08] px-6 py-8 transition duration-300 md:border-r lg:px-7 ${
                beneficio.destacado
                  ? "bg-[#82f000]/[0.055]"
                  : "hover:bg-white/[0.025]"
              }`}
            >
              {/* Número */}
              <span className="text-xs font-semibold tracking-[0.18em] text-white/25">
                {beneficio.numero}
              </span>

              {/* Icono */}
              <div
                className={`mt-10 flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold transition ${
                  beneficio.destacado
                    ? "border-[#82f000]/50 bg-[#82f000]/15 text-[#82f000]"
                    : "border-white/10 bg-white/[0.035] text-white/60 group-hover:border-[#82f000]/40 group-hover:text-[#82f000]"
                }`}
              >
                {beneficio.icono}
              </div>

              <h3 className="mt-7 text-xl font-semibold text-white">
                {beneficio.titulo}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                {beneficio.descripcion}
              </p>
            </article>
          ))}
        </div>

        {/* Guía NOVA */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-[#82f000]/20 bg-gradient-to-r from-[#101410] via-[#111611] to-[#0b0d0b]">
          <div className="grid items-center gap-8 px-7 py-9 lg:grid-cols-[1fr_auto] lg:px-10">
            <div className="flex items-start gap-5">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-2xl font-bold text-[#82f000] sm:flex">
                N
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                  Guía NOVA
                </span>

                <h3 className="mt-2 text-2xl font-semibold">
                  ¿Prefieres que te acompañemos?
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                  Si es tu primera compra o simplemente tienes una duda, podrás
                  recibir orientación para continuar con tranquilidad.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="group flex w-fit items-center gap-3 rounded-xl bg-[#82f000] px-6 py-3.5 text-sm font-bold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#9cff35]"
            >
              Hablar con un Guía
              <span className="transition group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}