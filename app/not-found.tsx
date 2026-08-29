import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[#080a08] px-6 text-white">
    <div className="max-w-xl text-center"><p className="text-sm font-black uppercase tracking-[0.3em] text-[#82f000]">Error 404</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">Esta página no existe</h1><p className="mt-4 leading-7 text-white/50">La dirección puede estar incompleta o el contenido fue movido.</p><Link href="/" className="mt-8 inline-flex rounded-xl bg-[#82f000] px-6 py-3 font-black text-black hover:bg-[#9cff35]">Volver a NOVA</Link></div>
  </main>;
}
