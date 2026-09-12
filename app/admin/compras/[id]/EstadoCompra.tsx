"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EstadoCompra({ compraId, estado, puedeRecibir }: { compraId: string; estado: string; puedeRecibir: boolean }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);
  async function cambiar(nuevoEstado: string) {
    setProcesando(true); setMensaje("");
    const respuesta = await fetch(`/api/admin/compras/${compraId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: nuevoEstado }) });
    const resultado = await respuesta.json(); setProcesando(false);
    if (!respuesta.ok) { setMensaje(resultado.error || "No fue posible cambiar el estado."); return; }
    setMensaje("Estado actualizado correctamente."); router.refresh();
  }
  if (["recibida", "anulada"].includes(estado)) return <p className="mt-4 text-sm text-zinc-400">Esta compra ya está cerrada y no admite nuevos cambios.</p>;
  return <div className="mt-5"><div className="flex flex-wrap gap-3">
    {estado === "borrador" ? <button disabled={procesando} onClick={() => cambiar("ordenada")} className="min-h-11 rounded-xl bg-[#82f000] px-5 font-black text-black">Marcar como ordenada</button> : null}
    {estado === "ordenada" ? <button disabled={procesando || !puedeRecibir} onClick={() => cambiar("recibida")} className="min-h-11 rounded-xl bg-[#82f000] px-5 font-black text-black disabled:cursor-not-allowed disabled:opacity-35">Marcar como recibida</button> : null}
    <button disabled={procesando} onClick={() => cambiar("anulada")} className="min-h-11 rounded-xl border border-red-900 px-5 font-black text-red-300">Anular compra</button>
  </div>
  {estado === "ordenada" && !puedeRecibir ? <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Antes de recibirla debes vincular cada línea con un producto real del inventario. Así evitamos sumar existencias al producto equivocado.</p> : null}
  {mensaje ? <p className={`mt-4 text-sm font-bold ${mensaje.includes("correctamente") ? "text-lime-400" : "text-red-300"}`}>{mensaje}</p> : null}</div>;
}
