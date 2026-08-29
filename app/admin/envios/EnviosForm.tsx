"use client";

import { FormEvent, useState } from "react";
import type { ConfiguracionEnvios } from "@/app/data/envios";

export default function EnviosForm({ configuracion }: { configuracion: ConfiguracionEnvios }) {
  const [form, setForm] = useState({
    tarifaCali: String(configuracion.tarifaCali),
    tarifaValle: String(configuracion.tarifaValle),
    tarifaNacional: String(configuracion.tarifaNacional),
    envioGratisActivo: configuracion.envioGratisActivo,
    envioGratisDesde: String(configuracion.envioGratisDesde),
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true); setMensaje(""); setEsError(false);
    const respuesta = await fetch("/api/admin/envios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);
    if (!respuesta.ok) { setEsError(true); setMensaje(data.error ?? "No fue posible guardar las tarifas."); return; }
    setMensaje("Tarifas actualizadas correctamente.");
  }

  return <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <div className="grid gap-5 md:grid-cols-3">
      <label className="text-sm text-zinc-400">Cali<input required min="0" step="1" type="number" className={campo} value={form.tarifaCali} onChange={(e) => setForm({...form, tarifaCali:e.target.value})} /></label>
      <label className="text-sm text-zinc-400">Resto del Valle del Cauca<input required min="0" step="1" type="number" className={campo} value={form.tarifaValle} onChange={(e) => setForm({...form, tarifaValle:e.target.value})} /></label>
      <label className="text-sm text-zinc-400">Resto de Colombia<input required min="0" step="1" type="number" className={campo} value={form.tarifaNacional} onChange={(e) => setForm({...form, tarifaNacional:e.target.value})} /></label>
    </div>
    <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-5">
      <label className="flex cursor-pointer items-center gap-3 font-bold"><input type="checkbox" checked={form.envioGratisActivo} onChange={(e) => setForm({...form, envioGratisActivo:e.target.checked})} /> Activar envío gratis desde un monto</label>
      <label className="mt-4 block max-w-md text-sm text-zinc-400">Compra mínima para envío gratis<input required min="0" step="1" type="number" disabled={!form.envioGratisActivo} className={`${campo} disabled:opacity-40`} value={form.envioGratisDesde} onChange={(e) => setForm({...form, envioGratisDesde:e.target.value})} /></label>
    </div>
    <p className="mt-5 text-sm text-zinc-500">Los cambios aplican a compras nuevas. Los pedidos anteriores conservan el costo con el que fueron creados.</p>
    {mensaje && <p className={`mt-4 text-sm ${esError ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
    <button disabled={guardando} className="mt-6 cursor-pointer rounded-xl bg-lime-400 px-6 py-3 font-black text-black hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">{guardando ? "Guardando..." : "Guardar tarifas"}</button>
  </form>;
}
