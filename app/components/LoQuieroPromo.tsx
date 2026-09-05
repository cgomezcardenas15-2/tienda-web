import Link from "next/link";

export default function LoQuieroPromo() {
  return (
    <section className="relative overflow-hidden border-y border-[#82f000]/15 bg-[#090d09] px-5 py-16 text-white lg:px-8 lg:py-20">
      <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#82f000]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-0 text-[220px] font-black leading-none text-white/[0.025] sm:text-[300px]">
        ?
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#82f000]/35 bg-[#82f000]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#82f000]">
              Tú propones
            </span>
            <span className="h-px w-12 bg-[#82f000]/40" />
          </div>

          <h2 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">
            ¿Lo quieres? <span className="text-[#82f000]">Pídelo</span> y NOVA lo trae.
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Cuéntanos qué producto necesitas. Tu interés nos ayuda a elegir las próximas novedades para personas y negocios.
          </p>
        </div>

        <Link
          href="/lo-quiero"
          className="group inline-flex min-w-52 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#82f000] px-7 py-4 font-black text-black shadow-[0_18px_50px_rgba(130,240,0,0.18)] transition hover:-translate-y-1 hover:bg-[#9cff35]"
        >
          LO QUIERO
          <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </section>
  );
}
