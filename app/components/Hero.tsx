import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07] bg-[#070907] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_30%,rgba(130,240,0,0.13),transparent_30%),radial-gradient(circle_at_82%_45%,rgba(130,240,0,0.1),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-20">
        <div className="relative z-20 max-w-2xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#82f000]/30 bg-[#82f000]/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#a2ff3d]">
            <span className="h-2 w-2 rounded-full bg-[#82f000] shadow-[0_0_14px_rgba(130,240,0,.9)]" /> Compra fácil. Elige mejor.
          </div>
          <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-[5rem]">
            Lo que necesitas,<span className="mt-2 block text-[#82f000]">cuando lo necesitas.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">Productos útiles para tu hogar, tus celebraciones y tus mascotas, seleccionados para comprar sin complicaciones.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/#productos" className="group inline-flex cursor-pointer items-center gap-3 rounded-xl bg-[#82f000] px-7 py-4 font-black text-black shadow-[0_18px_50px_rgba(130,240,0,.16)] transition hover:-translate-y-0.5 hover:bg-[#a2ff3d]">Ver productos <span className="transition group-hover:translate-x-1">→</span></Link>
            <Link href="/lo-quiero" className="inline-flex cursor-pointer items-center rounded-xl border border-white/20 bg-white/[0.035] px-7 py-4 font-bold text-white transition hover:border-[#82f000]/60 hover:text-[#a2ff3d]">Pídele algo a NOVA</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-white/45 sm:text-sm">
            <span><b className="mr-2 text-[#82f000]">✓</b>Pago protegido</span><span><b className="mr-2 text-[#82f000]">✓</b>Envíos con seguimiento</span><span><b className="mr-2 text-[#82f000]">✓</b>Atención directa</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[610px] lg:mx-0">
          <div className="absolute -inset-7 rounded-[3rem] bg-[#82f000]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/15 bg-[#101410] shadow-[0_35px_100px_rgba(0,0,0,.55)]">
            <div className="absolute left-5 top-5 z-20 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] backdrop-blur-md">Selección NOVA</div>
            <Image src="/hero-products.png" alt="Selección de productos de NOVA" width={1024} height={1536} priority className="aspect-[5/4] h-full w-full object-cover object-top" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-6 pb-6 pt-24"><p className="text-xl font-black">Todo en un mismo lugar.</p><p className="mt-1 text-sm text-white/50">Compra al detal o aprovecha precios por mayor.</p></div>
          </div>
          <Link href="/categoria/hogar" className="absolute -left-3 top-[42%] hidden cursor-pointer rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-md transition hover:border-[#82f000]/50 sm:block lg:-left-8">🏠 Hogar</Link>
          <Link href="/categoria/mascotas" className="absolute -right-3 top-1/4 hidden cursor-pointer rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-md transition hover:border-[#82f000]/50 sm:block lg:-right-6">🐾 Mascotas</Link>
          <Link href="/categoria/pinateria" className="absolute -right-2 bottom-[18%] hidden cursor-pointer rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-md transition hover:border-[#82f000]/50 sm:block lg:-right-9">🎉 Piñatería</Link>
        </div>
      </div>
    </section>
  );
}
