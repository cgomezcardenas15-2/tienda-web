"use client";

import { FormEvent, useState } from "react";

type Variante = { id:string; nombre:string; color:string|null; talla:string|null; sku:string; precio:number|null; controla_stock:boolean; stock:number; imagen_url:string|null; activo:boolean; orden:number };
type Producto = { id:string; nombre:string; sku:string|null; precio:number; imagen_url:string|null };
const vacio = { nombre:"", color:"", talla:"", sku:"", precio:"", stock:"0", imagen_url:"", activo:true };

export default function VariantesManager({ producto, iniciales }: { producto: Producto; iniciales: Variante[] }) {
  const [variantes, setVariantes] = useState(iniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  function editar(variante: Variante) {
    setEditando(variante.id);
    setForm({ nombre:variante.nombre, color:variante.color ?? "", talla:variante.talla ?? "", sku:variante.sku, precio:variante.precio?.toString() ?? "", stock:String(variante.stock), imagen_url:variante.imagen_url ?? "", activo:variante.activo });
    setMensaje("");
  }
  function cancelar(){ setEditando(null); setForm(vacio); setMensaje(""); }

  async function guardar(event: FormEvent) {
    event.preventDefault(); setGuardando(true); setMensaje("");
    const url = editando ? `/api/admin/variantes/${editando}` : "/api/admin/variantes";
    const respuesta = await fetch(url, { method: editando ? "PATCH" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, productoId:producto.id }) });
    const data = await respuesta.json(); setGuardando(false);
    if (!respuesta.ok) { setMensaje(data.error ?? "No fue posible guardar."); return; }
    setVariantes((actual) => editando ? actual.map((item) => item.id === editando ? data.variante : item) : [...actual, data.variante]);
    cancelar(); setMensaje("Guardado correctamente.");
  }

  async function eliminar(id:string) {
    if (!window.confirm("¿Eliminar esta variante? Los pedidos anteriores conservarán su información.")) return;
    const respuesta = await fetch(`/api/admin/variantes/${id}`, { method:"DELETE" });
    const data = await respuesta.json();
    if (!respuesta.ok) { setMensaje(data.error ?? "No fue posible eliminar."); return; }
    setVariantes((actual) => actual.filter((item) => item.id !== id));
  }

  const campo = "w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";
  return <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-black">{editando ? "Editar variante" : "Nueva variante"}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm text-zinc-400">Nombre visible<input required className={`${campo} mt-2`} placeholder="Ej: Negro / Mediano" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Color<input className={`${campo} mt-2`} placeholder="Negro" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Talla o tamaño<input className={`${campo} mt-2`} placeholder="M" value={form.talla} onChange={e=>setForm({...form,talla:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">SKU único<input required className={`${campo} mt-2`} placeholder="CAM-NEG-M" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Stock<input required min="0" type="number" className={`${campo} mt-2`} value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Precio especial (opcional)<input min="0" type="number" className={`${campo} mt-2`} placeholder={`Base: ${producto.precio}`} value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})}/></label>
        <label className="sm:col-span-2 text-sm text-zinc-400">URL de la foto (opcional)<input type="url" className={`${campo} mt-2`} placeholder="https://..." value={form.imagen_url} onChange={e=>setForm({...form,imagen_url:e.target.value})}/></label>
        <label className="sm:col-span-2 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={e=>setForm({...form,activo:e.target.checked})}/> Mostrar esta variante en la tienda</label>
      </div>
      {mensaje && <p className="mt-4 text-sm text-lime-300">{mensaje}</p>}
      <div className="mt-5 flex gap-3"><button disabled={guardando} className="rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>{editando && <button type="button" onClick={cancelar} className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">Cancelar</button>}</div>
    </form>
    <section className="space-y-3"><h2 className="text-xl font-black">Variantes creadas ({variantes.length})</h2>{variantes.length === 0 ? <p className="rounded-2xl border border-zinc-800 p-6 text-zinc-400">Este producto todavía se compra como una sola opción.</p> : variantes.map(v=><article key={v.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex justify-between gap-4"><div><h3 className="font-black">{v.nombre}</h3><p className="mt-1 text-xs text-zinc-500">SKU {v.sku} · Stock {v.stock} · {v.activo ? "Visible" : "Oculta"}</p><p className="mt-2 text-sm text-zinc-300">{v.color || "Sin color"}{v.talla ? ` · Talla ${v.talla}` : ""}{v.precio !== null ? ` · $${v.precio.toLocaleString("es-CO")}` : " · Precio base"}</p></div><div className="flex gap-2"><button onClick={()=>editar(v)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400">Editar</button><button onClick={()=>eliminar(v.id)} className="rounded-lg border border-red-900 px-3 py-2 text-xs font-bold text-red-300">Eliminar</button></div></div></article>)}</section>
  </div>;
}
