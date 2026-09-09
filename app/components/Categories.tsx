import Link from "next/link";

const categorias = [
  { numero: "01", nombre: "Hogar", descripcion: "Soluciones prácticas que hacen más sencillo tu día a día.", icono: "🏠", href: "/categoria/hogar", estilo: "from-[#82f000]/16 via-[#15200e] to-[#0c0f0c]" },
  { numero: "02", nombre: "Piñatería", descripcion: "Detalles, decoración y diversión para celebrar en grande.", icono: "🎉", href: "/categoria/pinateria", estilo: "from-[#ff9d00]/16 via-[#211509] to-[#0c0f0c]" },
  { numero: "03", nombre: "Mascotas", descripcion: "Productos pensados para cuidarlas, consentirlas y disfrutarlas.", icono: "🐾", href: "/categoria/mascotas", estilo: "from-[#2ac7ff]/14 via-[#0a1a20] to-[#0c0f0c]" },
];

export default function Categories() {
  return (
    <section id="categorias" className="relative scroll-mt-40 overflow-hidden bg-[#0a0c0a] px-6 py-20 text-white lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#82f000]/5 blur-[130px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#82f000]">Tres mundos. Una sola NOVA.</span>
            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.035em] sm:text-5xl">Encuentra tu categoría</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">Entra directo a lo que buscas. Cada selección está organizada para ayudarte a decidir más rápido.</p>
          </div>
          <Link href="/#productos" className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/65 transition hover:border-[#82f000]/50 hover:text-[#82f000]">Ver todo <span className="transition group-hover:translate-x-1">→</span></Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categorias.map((categoria) => (
            <Link key={categoria.nombre} href={categoria.href} className={`group relative min-h-[330px] cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${categoria.estilo} p-7 transition duration-300 hover:-translate-y-1.5 hover:border-[#82f000]/45`}>
              <span className="text-xs font-black tracking-[0.2em] text-white/30">{categoria.numero}</span>
              <div className="absolute -right-7 top-8 text-[8.5rem] opacity-20 grayscale transition duration-500 group-hover:-translate-x-2 group-hover:scale-110 group-hover:opacity-35 group-hover:grayscale-0" aria-hidden="true">{categoria.icono}</div>
              <div className="absolute inset-x-7 bottom-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl backdrop-blur-sm">{categoria.icono}</div>
                <div className="flex items-center justify-between gap-5">
                  <h3 className="text-3xl font-black tracking-tight">{categoria.nombre}</h3>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg transition group-hover:border-[#82f000] group-hover:bg-[#82f000] group-hover:text-black">→</span>
                </div>
                <p className="mt-3 max-w-[17rem] text-sm leading-6 text-white/50">{categoria.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/#productos" className="group relative mt-5 flex min-h-[145px] cursor-pointer flex-col justify-between overflow-hidden rounded-[1.75rem] border border-orange-400/25 bg-[linear-gradient(110deg,rgba(249,115,22,.17),rgba(15,15,12,.95)_48%,rgba(130,240,0,.09))] p-7 transition hover:border-orange-400/60 sm:flex-row sm:items-center">
          <div className="relative z-10"><span className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Precios que se sienten</span><h3 className="mt-2 text-3xl font-black">Ofertas NOVA <span aria-hidden="true">🔥</span></h3><p className="mt-2 text-sm text-white/50">Descubre oportunidades seleccionadas y precios especiales.</p></div>
          <span className="relative z-10 mt-6 inline-flex w-fit items-center gap-3 rounded-xl bg-orange-500 px-6 py-3 font-black text-black transition group-hover:bg-orange-400 sm:mt-0">Ver ofertas <b className="transition group-hover:translate-x-1">→</b></span>
          <div className="pointer-events-none absolute -right-10 -top-20 text-[13rem] font-black text-white/[0.025]">%</div>
        </Link>
      </div>
    </section>
  );
}
