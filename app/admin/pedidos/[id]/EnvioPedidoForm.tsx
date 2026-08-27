"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type EnvioInicial = {
  transportadora: string;
  servicio: string;
  numeroGuia: string;
  urlSeguimiento: string;
};

export default function EnvioPedidoForm({ pedidoId, estadoPedido, inicial }: { pedidoId: string; estadoPedido: string; inicial: EnvioInicial }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const editable = ["preparando", "enviado"].includes(estadoPedido);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");

    const datos = new FormData(event.currentTarget);
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/envio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportadora: datos.get("transportadora"),
          servicio: datos.get("servicio"),
          numeroGuia: datos.get("numeroGuia"),
          urlSeguimiento: datos.get("urlSeguimiento"),
        }),
      });
      const resultado = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      if (!respuesta.ok) throw new Error(resultado?.error || "No fue posible guardar la información de envío.");
      setMensaje("Información de envío guardada.");
      router.refresh();
    } catch (errorActual) {
      setError(errorActual instanceof Error ? errorActual.message : "No fue posible guardar la información de envío.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-zinc-300">Transportadora
        <input name="transportadora" defaultValue={inicial.transportadora} disabled={!editable} required maxLength={80} placeholder="Ej. Servientrega" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400 disabled:opacity-60" />
      </label>
      <label className="text-sm font-semibold text-zinc-300">Servicio
        <input name="servicio" defaultValue={inicial.servicio} disabled={!editable} maxLength={80} placeholder="Ej. Envío nacional" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400 disabled:opacity-60" />
      </label>
      <label className="text-sm font-semibold text-zinc-300">Número de guía
        <input name="numeroGuia" defaultValue={inicial.numeroGuia} disabled={!editable} required maxLength={120} placeholder="Número suministrado por la transportadora" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400 disabled:opacity-60" />
      </label>
      <label className="text-sm font-semibold text-zinc-300">Enlace de seguimiento
        <input name="urlSeguimiento" type="url" defaultValue={inicial.urlSeguimiento} disabled={!editable} maxLength={500} placeholder="https://..." className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400 disabled:opacity-60" />
      </label>
      <div className="md:col-span-2">
        {editable ? <button type="submit" disabled={guardando} className="rounded-xl border border-lime-400 px-5 py-3 text-sm font-black text-lime-300 transition hover:bg-lime-400 hover:text-black disabled:cursor-wait disabled:opacity-60">{guardando ? "Guardando…" : "Guardar información de envío"}</button> : <p className="text-sm text-zinc-500">La información logística solo puede editarse mientras el pedido está preparando o enviado.</p>}
        {mensaje ? <p role="status" className="mt-3 text-sm text-lime-300">{mensaje}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </form>
  );
}
