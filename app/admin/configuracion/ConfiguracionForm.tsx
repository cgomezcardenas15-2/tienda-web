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

  return <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-5">
      <label className="flex cursor-pointer items-center gap-3 font-bold">
        <input type="checkbox" checked={activa} onChange={(event) => setActiva(event.target.checked)} />
        Exigir un monto mínimo para comprar
      </label>
      <label className="mt-5 block max-w-md text-sm text-zinc-400">
        Monto mínimo de productos
        <input required min="0" step="1" type="number" value={monto} onChange={(event) => setMonto(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400" />
      </label>
      <p className="mt-3 text-sm text-zinc-500">El costo del envío no cuenta para alcanzar este mínimo.</p>
    </div>
    {mensaje && <p className={`mt-4 text-sm ${error ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
    <button disabled={guardando} className="mt-6 rounded-xl bg-lime-400 px-6 py-3 font-black text-black hover:bg-lime-300 disabled:opacity-50">{guardando ? "Guardando..." : "Guardar configuración"}</button>
  </form>;
}
