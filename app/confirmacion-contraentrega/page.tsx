"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const dinero = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function ConfirmacionContraentrega() {
  const searchParams = useSearchParams();
  const numeroUrl = searchParams.get("pedido")?.trim() || "";
  const totalUrl = Number(searchParams.get("total"));
  const total = Number.isFinite(totalUrl) && totalUrl >= 0 ? totalUrl : null;

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-14 sm:py-20">
      <section className="overflow-hidden rounded-3xl border border-[#82f000]/30 bg-white/[0.035] shadow-[0_0_80px_rgba(130,240,0,0.08)]">
        <div className="border-b border-[#82f000]/15 bg-[#82f000]/[0.055] p-6 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#82f000] text-2xl font-black text-black">✓</div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-[#82f000]">Pedido confirmado</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Paga en efectivo cuando lo recibas</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            Tu pedido quedó reservado para entrega en Cali. No se realizó ningún cobro en línea: entrega el total en efectivo al domiciliario cuando recibas los productos.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-10">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Número del pedido</p>
            <p className="mt-2 break-all text-xl font-black text-[#82f000]">{numeroUrl || "Pedido confirmado"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Estado del pago</p>
            <p className="mt-2 text-xl font-black">Pendiente en efectivo</p>
            {total !== null ? <p className="mt-2 text-sm text-white/50">Total a entregar: <strong className="text-white">{dinero.format(total)}</strong></p> : null}
          </div>

          <div className="sm:col-span-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.055] p-5 text-sm leading-6 text-amber-100/80">
            Ten disponible el valor exacto o confirma el cambio con el domiciliario. NOVA marcará el pago como recibido únicamente después de la entrega.
          </div>

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/consultar-pedido" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#82f000] px-5 py-3 text-center font-black text-black transition hover:bg-[#9cff35]">Consultar mi pedido</Link>
            <Link href="/" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-center font-bold text-white/75 transition hover:border-[#82f000]/45 hover:text-[#82f000]">Volver a la tienda</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ConfirmacionContraentregaPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="min-h-[70vh] px-5 py-20 text-center text-white/50">Cargando confirmación…</main>}>
        <ConfirmacionContraentrega />
      </Suspense>
      <Footer />
    </>
  );
}
