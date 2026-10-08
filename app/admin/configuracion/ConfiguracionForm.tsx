"use client";

import { FormEvent, useState } from "react";
import type { ConfiguracionTienda } from "@/app/lib/configuracionTienda";

export default function ConfiguracionForm({ configuracion }: { configuracion: ConfiguracionTienda }) {
  const [activa, setActiva] = useState(configuracion.compraMinimaActiva);
  const [monto, setMonto] = useState(String(configuracion.montoMinimoCompra));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true); setMensaje(""); setError(false);
    const respuesta = await fetch("/api/admin/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compraMinimaActiva: activa, montoMinimoCompra: monto }),
    });
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);
    if (!respuesta.ok) { setError(true); setMensaje(data.error ?? "No fue posible guardar."); return; }
    setMensaje("Configuración guardada correctamente.");
  }

  const montoNumerico = Number(monto || 0);
  const montoFormateado = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number.isFinite(montoNumerico) ? montoNumerico : 0);

  return <form onSubmit={guardar} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-lime-950/20 sm:p-8">
    <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-white">Monto mínimo de compra</h2>
        <p className="mt-1 text-sm text-zinc-400">Decide si deseas exigir un valor mínimo antes de permitir el pago.</p>
      </div>
      <label className="flex cursor-pointer items-center gap-3 self-start rounded-full border border-zinc-700 bg-black px-4 py-2 text-sm font-black text-white sm:self-auto">
        <input className="h-5 w-5 accent-lime-400" type="checkbox" checked={activa} onChange={(event) => setActiva(event.target.checked)} />
        {activa ? "ACTIVO" : "DESACTIVADO"}
      </label>
    </div>

    <div className={`mt-6 rounded-2xl border p-5 transition ${activa ? "border-lime-400/40 bg-lime-400/5" : "border-zinc-800 bg-black/30"}`}>
      <label className="block text-sm font-bold text-zinc-300">
        Valor mínimo de los productos
        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500">$</span>
          <input required min="0" step="1000" type="number" value={monto} onChange={(event) => setMonto(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black py-3 pl-9 pr-4 text-lg font-black text-white outline-none focus:border-lime-400" />
        </div>
      </label>
      <p className="mt-3 text-sm text-zinc-400">El cliente deberá comprar al menos <strong className="text-white">{montoFormateado}</strong> en productos. El costo del envío no cuenta para completar este valor.</p>
      {!activa && <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">Actualmente los clientes pueden comprar por cualquier valor.</p>}
    </div>
    {mensaje && <p className={`mt-4 text-sm ${error ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
    <button disabled={guardando} className="mt-6 w-full rounded-xl bg-lime-400 px-6 py-3 font-black text-black hover:bg-lime-300 disabled:opacity-50 sm:w-auto">{guardando ? "Guardando..." : "Guardar configuración"}</button>
  </form>;
}
