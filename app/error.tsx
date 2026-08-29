"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#080a08] px-6 text-white">
    <div className="max-w-xl text-center"><p className="text-sm font-black uppercase tracking-[0.3em] text-[#82f000]">NOVA</p><h1 className="mt-4 text-4xl font-black">Algo no cargó correctamente</h1><p className="mt-4 leading-7 text-white/50">Tus datos no se han perdido. Puedes intentarlo nuevamente o regresar al inicio.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={reset} className="rounded-xl bg-[#82f000] px-6 py-3 font-black text-black">Intentar nuevamente</button><Link href="/" className="rounded-xl border border-white/20 px-6 py-3 font-bold">Volver al inicio</Link></div></div>
  </main>;
}
