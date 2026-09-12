"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Linea = { descripcion: string; sku: string; cantidad: string; costo_unitario: string };
const lineaVacia = (): Linea => ({ descripcion: "", sku: "", cantidad: "1", costo_unitario: "" });
function fechaLocal() {
  const fecha = new Date();
  const offset = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
}

export default function CompraForm({ proveedorId, moneda }: { proveedorId: string; moneda: string }) {
  const router = useRouter();
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cambiar(indice: number, campo: keyof Linea, valor: string) {
    setLineas(actuales => actuales.map((linea, i) => i === indice ? { ...linea, [campo]: valor } : linea));
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setGuardando(true); setMensaje("");
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));
    const respuesta = await fetch("/api/admin/compras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...datos, proveedor_id: proveedorId, productos: lineas }) });
    const resultado = await respuesta.json(); setGuardando(false);
    if (!respuesta.ok) { setMensaje(resultado.error || "No fue posible registrar la compra."); return; }
    setMensaje(`Compra NOVA-${String(resultado.consecutivo).padStart(5, "0")} guardada como borrador.`);
    setLineas([lineaVacia()]); formulario.reset(); router.refresh();
  }

  return <form onSubmit={guardar} className="mt-5 grid gap-4">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm text-zinc-300">Factura del proveedor<input name="factura_proveedor" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Fecha de compra<input required name="fecha_compra" type="date" defaultValue={fechaLocal()} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Moneda<select name="moneda" defaultValue={moneda} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4"><option>COP</option><option>USD</option><option>CNY</option><option>EUR</option></select></label>
    </div>
    <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-black">Productos comprados</h3><button type="button" onClick={() => setLineas([...lineas, lineaVacia()])} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold">+ Agregar producto</button></div>
      {lineas.map((linea, indice) => <div key={indice} className="grid gap-3 rounded-xl border border-zinc-800 bg-black/50 p-4 sm:grid-cols-[1fr_0.65fr_0.45fr_0.65fr_auto]">
        <label className="text-xs text-zinc-400">Producto<input required value={linea.descripcion} onChange={e => cambiar(indice, "descripcion", e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-3 text-base text-white" /></label>
        <label className="text-xs text-zinc-400">SKU (opcional)<input value={linea.sku} onChange={e => cambiar(indice, "sku", e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-3 text-base text-white" /></label>
        <label className="text-xs text-zinc-400">Cantidad<input required min="1" type="number" value={linea.cantidad} onChange={e => cambiar(indice, "cantidad", e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-3 text-base text-white" /></label>
        <label className="text-xs text-zinc-400">Costo unitario<input required min="0" step="0.01" type="number" value={linea.costo_unitario} onChange={e => cambiar(indice, "costo_unitario", e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-3 text-base text-white" /></label>
        <button type="button" disabled={lineas.length === 1} onClick={() => setLineas(lineas.filter((_, i) => i !== indice))} className="self-end rounded-lg border border-red-900 px-3 py-3 text-sm font-bold text-red-300 disabled:opacity-30">Quitar</button>
      </div>)}</div>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm text-zinc-300">Impuestos<input name="impuestos" type="number" min="0" step="0.01" defaultValue="0" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Costo de envío<input name="costo_envio" type="number" min="0" step="0.01" defaultValue="0" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Otros costos<input name="otros_costos" type="number" min="0" step="0.01" defaultValue="0" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
    </div>
    <label className="text-sm text-zinc-300">Notas de la compra<textarea name="notas" rows={3} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-4" /></label>
    {mensaje ? <p className={`text-sm font-bold ${mensaje.includes("guardada") ? "text-lime-400" : "text-red-300"}`}>{mensaje}</p> : null}
    <button disabled={guardando} className="min-h-12 rounded-xl bg-[#82f000] px-6 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar compra como borrador"}</button>
  </form>;
}
