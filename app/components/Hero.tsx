export default function Hero() {
  const beneficios = [
    {
      titulo: "Compra segura",
      texto: "Protegemos tu compra de principio a fin.",
      icono: "✓",
    },
    {
      titulo: "Envíos confiables",
      texto: "Información clara sobre tu entrega.",
      icono: "✓",
    },
    {
      titulo: "Guía NOVA",
      texto: "Te acompañamos si necesitas ayuda.",
      icono: "◇",
    },
    {
      titulo: "Atención y respaldo",
      texto: "Siempre sabrás con quién hablar.",
      icono: "✓",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#080a08] text-white">
      {/* Iluminación del fondo */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[430px] w-[430px] rounded-full bg-[#82f000]/10 blur-[150px]" />

      <div className="pointer-events-none absolute right-[-120px] top-0 h-[620px] w-[620px] rounded-full bg-[#82f000]/10 blur-[170px]" />

      {/* Hero principal */}
      <div className="relative mx-auto grid min-h-[520px] max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-10 lg:py-14">
        {/* Contenido izquierdo */}
        <div className="relative z-20 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#82f000]/30 bg-[#82f000]/10 px-4 py-2 text-sm font-semibold text-[#9cff35]">
            <span className="h-2 w-2 rounded-full bg-[#82f000] shadow-[0_0_12px_rgba(130,240,0,0.9)]" />
            Una nueva forma de comprar
          </div>

          <h1 className="mt-7 text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Todo lo que
            <br />
            necesitas,
            <br />
            <span className="text-[#82f000]">en un solo lugar.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
            Miles de productos para cada momento, con una experiencia sencilla,
            segura y acompañada.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <button className="rounded-lg bg-[#82f000] px-7 py-3.5 font-bold text-black shadow-[0_10px_35px_rgba(130,240,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#9cff35]">
              Comprar ahora
            </button>

            <button className="rounded-lg border border-white/20 bg-white/[0.02] px-7 py-3.5 font-semibold text-white transition duration-300 hover:border-[#82f000] hover:text-[#82f000]">
              Descubrir NOVA
            </button>
          </div>
        </div>

        {/* Ilustración derecha */}
        <div className="relative hidden min-h-[430px] items-center justify-center lg:flex">
          <div className="pointer-events-none absolute h-[380px] w-[380px] rounded-full bg-[#82f000]/10 blur-[100px]" />

          <img
            src="/hero-products.png"
            alt="Productos disponibles en NOVA"
            className="relative z-10 w-full max-w-[590px] object-contain drop-shadow-[0_35px_65px_rgba(0,0,0,0.65)]"
          />
        </div>
      </div>

      {/* Franja de confianza */}
      <div className="relative border-y border-white/[0.07] bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/[0.07] px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-10">
          {beneficios.map((beneficio) => (
            <div
              key={beneficio.titulo}
              className="group flex min-h-[110px] items-center gap-4 px-3 py-5 transition hover:bg-white/[0.025] sm:px-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#82f000]/25 bg-[#82f000]/10 text-sm font-bold text-[#82f000] transition group-hover:border-[#82f000]/60 group-hover:bg-[#82f000]/15">
                {beneficio.icono}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  {beneficio.titulo}
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  {beneficio.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Acceso discreto a Guía NOVA */}
        <div className="border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 text-center sm:flex-row sm:text-left lg:px-10">
            <p className="text-sm text-white/45">
              ¿No sabes qué producto elegir?
              <span className="ml-1 text-white/75">
                Un Guía NOVA puede ayudarte paso a paso.
              </span>
            </p>

            <button className="group flex items-center gap-2 text-sm font-semibold text-[#82f000] transition hover:text-[#9cff35]">
              Hablar con un Guía
              <span className="transition group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}