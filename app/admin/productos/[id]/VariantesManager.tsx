"use client";

import { FormEvent, useState } from "react";
import ImageUploader from "../ImageUploader";

type Variante = { id:string; nombre:string; color:string|null; talla:string|null; sku:string; precio:number|null; precio_mayorista:number|null; cantidad_minima_mayorista:number|null; controla_stock:boolean; stock:number; imagen_url:string|null; activo:boolean; orden:number };
type Producto = { id:string; nombre:string; sku:string|null; precio:number; precio_mayorista:number|null; cantidad_minima_mayorista:number|null; venta_mayorista:boolean; imagen_url:string|null };
const vacio = { nombre:"", color:"", talla:"", sku:"", precio:"", precio_mayorista:"", cantidad_minima_mayorista:"", stock:"0", imagen_url:"", activo:true };
const PALETA = ["#111111", "#ffffff", "#22c55e", "#ef4444", "#3b82f6", "#facc15", "#f97316", "#ec4899", "#a855f7", "#71717a", "#92400e", "#d6c7a1"];
const COLORES_NOMBRE: Record<string, string> = { negro:"#111111", blanco:"#ffffff", verde:"#22c55e", rojo:"#ef4444", azul:"#3b82f6", amarillo:"#facc15", naranja:"#f97316", rosado:"#ec4899", rosa:"#ec4899", morado:"#a855f7", gris:"#71717a", cafe:"#92400e", beige:"#d6c7a1" };

function colorHex(valor:string) {
  if (/^#[0-9a-f]{6}$/i.test(valor)) return valor;
  return COLORES_NOMBRE[valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()] ?? "#82f000";
}

export default function VariantesManager({ producto, iniciales }: { producto: Producto; iniciales: Variante[] }) {
  const [variantes, setVariantes] = useState(iniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  function editar(variante: Variante) {
    setEditando(variante.id);
    setForm({ nombre:variante.nombre, color:variante.color ?? "", talla:variante.talla ?? "", sku:variante.sku, precio:variante.precio?.toString() ?? "", precio_mayorista:variante.precio_mayorista?.toString() ?? "", cantidad_minima_mayorista:variante.cantidad_minima_mayorista?.toString() ?? "", stock:String(variante.stock), imagen_url:variante.imagen_url ?? "", activo:variante.activo });
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
      <h2 className="text-xl font-black">{editando ? "Editar color u opción" : "Nuevo color u opción"}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Crea una opción por cada color disponible. Cada una maneja su propio SKU, fotografía y existencias. Si el stock queda en 0, el cliente la verá como agotada y no podrá seleccionarla.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm text-zinc-400">Nombre visible<input required className={`${campo} mt-2`} placeholder="Ej: Negro" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
        <div className="sm:col-span-2">
          <p className="text-sm text-zinc-400">Color de la opción</p>
          <div className="mt-2 rounded-xl border border-zinc-700 bg-black p-4">
            <div className="flex flex-wrap items-center gap-3">
              {PALETA.map((tono) => <button key={tono} type="button" aria-label={`Elegir color ${tono}`} title={tono} onClick={()=>setForm({...form,color:tono})} className={`h-10 w-10 rounded-full border-2 p-1 transition hover:scale-105 ${form.color && colorHex(form.color) === tono ? "border-lime-400 shadow-[0_0_0_3px_rgba(163,230,53,0.18)]" : "border-zinc-600"}`}><span className="block h-full w-full rounded-full border border-black/20" style={{backgroundColor:tono}} /></button>)}
              <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-lime-400"><input type="color" value={colorHex(form.color)} onChange={e=>setForm({...form,color:e.target.value})} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" /> Otro tono</label>
            </div>
            <p className="mt-3 text-xs text-zinc-500">El nombre visible identifica el color; esta paleta define el tono que verá el cliente.</p>
          </div>
        </div>
        <label className="text-sm text-zinc-400">Talla o tamaño<input className={`${campo} mt-2`} placeholder="M" value={form.talla} onChange={e=>setForm({...form,talla:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">SKU único<input required className={`${campo} mt-2`} placeholder="CAM-NEG-M" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Stock<input required min="0" type="number" className={`${campo} mt-2`} value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
        <label className="text-sm text-zinc-400">Precio especial (opcional)<input min="0" type="number" className={`${campo} mt-2`} placeholder={`Base: ${producto.precio}`} value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})}/></label>
        {producto.venta_mayorista && <>
          <label className="text-sm text-zinc-400">Precio mayorista propio (opcional)<input min="0" type="number" className={`${campo} mt-2`} placeholder={producto.precio_mayorista ? `Base: ${producto.precio_mayorista}` : "Usar precio del producto"} value={form.precio_mayorista} onChange={e=>setForm({...form,precio_mayorista:e.target.value})}/></label>
          <label className="text-sm text-zinc-400">Mínimo mayorista propio (opcional)<input min="2" type="number" className={`${campo} mt-2`} placeholder={producto.cantidad_minima_mayorista ? `Base: ${producto.cantidad_minima_mayorista}` : "Usar mínimo del producto"} value={form.cantidad_minima_mayorista} onChange={e=>setForm({...form,cantidad_minima_mayorista:e.target.value})}/></label>
        </>}
        <ImageUploader
          label="Fotografía de esta variante (opcional)"
          value={form.imagen_url}
          onChange={(imagen_url) => setForm({...form,imagen_url})}
        />
        <label className="sm:col-span-2 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={e=>setForm({...form,activo:e.target.checked})}/> Mostrar esta variante en la tienda</label>
      </div>
      {mensaje && <p className="mt-4 text-sm text-lime-300">{mensaje}</p>}
      <div className="mt-5 flex gap-3"><button disabled={guardando} className="rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>{editando && <button type="button" onClick={cancelar} className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">Cancelar</button>}</div>
    </form>
    <section className="space-y-3"><h2 className="text-xl font-black">Colores y opciones creadas ({variantes.length})</h2>{variantes.length === 0 ? <p className="rounded-2xl border border-zinc-800 p-6 text-zinc-400">Este producto todavía se compra como una sola opción.</p> : variantes.map(v=><article key={v.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex justify-between gap-4"><div className="flex gap-3"><span className="mt-0.5 h-9 w-9 shrink-0 rounded-full border-2 border-zinc-600 p-1"><span className="block h-full w-full rounded-full border border-black/20" style={{backgroundColor:colorHex(v.color ?? "")}} /></span><div><h3 className="font-black">{v.nombre}</h3><p className={`mt-1 text-xs font-semibold ${v.stock <= 0 ? "text-red-300" : "text-zinc-500"}`}>SKU {v.sku} · {v.stock <= 0 ? "Agotado · No seleccionable en la tienda" : `Stock ${v.stock}`} · {v.activo ? "Visible" : "Oculta"}</p><p className="mt-2 text-sm text-zinc-300">{v.talla ? `Talla ${v.talla} · ` : ""}{v.precio !== null ? `$${v.precio.toLocaleString("es-CO")}` : "Precio base"}</p>{producto.venta_mayorista && <p className="mt-1 text-xs text-lime-300">Mayorista: ${Number(v.precio_mayorista ?? producto.precio_mayorista).toLocaleString("es-CO")} desde {v.cantidad_minima_mayorista ?? producto.cantidad_minima_mayorista} unidades</p>}</div></div><div className="flex gap-2"><button onClick={()=>editar(v)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400">Editar</button><button onClick={()=>eliminar(v.id)} className="rounded-lg border border-red-900 px-3 py-2 text-xs font-bold text-red-300">Eliminar</button></div></div></article>)}</section>
  </div>;
}
