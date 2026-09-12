"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Opcion = { valor: string; etiqueta: string };

export default function VincularLinea({ compraId, lineaId, opciones, valorActual, bloqueado }: { compraId: string; lineaId: string; opciones: Opcion[]; valorActual: string; bloqueado: boolean }) {
  const router = useRouter();
  const [valor, setValor] = useState(valorActual);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  async function guardar() {
    if (!valor) { setError("Selecciona un producto."); return; }
    setGuardando(true); setError("");
    const [productoId, varianteId = ""] = valor.split("|");
    const respuesta = await fetch(`/api/admin/compras/${compraId}/lineas/${lineaId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ producto_id: productoId, variante_id: varianteId || null }) });
    const resultado = await respuesta.json(); setGuardando(false);
    if (!respuesta.ok) { setError(resultado.error || "No fue posible vincular."); return; }
    router.refresh();
  }
  return <div className="min-w-[230px]"><div className="flex gap-2"><select disabled={bloqueado || guardando} value={valor} onChange={e => setValor(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm"><option value="">Sin vincular</option>{opciones.map(opcion => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}</select><button type="button" disabled={bloqueado || guardando || !valor} onClick={guardar} className="rounded-lg border border-lime-500 px-3 text-xs font-black text-lime-300 disabled:opacity-30">Guardar</button></div>{error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}</div>;
}
