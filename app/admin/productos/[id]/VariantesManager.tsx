"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "../ImageUploader";

type Variante = { id:string; nombre:string; color:string|null; talla:string|null; sku:string; precio:number|null; precio_mayorista:number|null; cantidad_minima_mayorista:number|null; controla_stock:boolean; stock:number; imagen_url:string|null; activo:boolean; orden:number };
type Producto = { id:string; nombre:string; sku:string|null; precio:number; precio_mayorista:number|null; cantidad_minima_mayorista:number|null; venta_mayorista:boolean; controla_stock:boolean; stock:number; imagen_url:string|null; activo:boolean };
const vacio = { nombre:"", color:"", talla:"", sku:"", precio:"", precio_mayorista:"", cantidad_minima_mayorista:"", stock:"0", imagen_url:"", activo:true };
const PALETA = ["#111111", "#ffffff", "#22c55e", "#ef4444", "#3b82f6", "#facc15", "#f97316", "#ec4899", "#a855f7", "#71717a", "#92400e", "#d6c7a1"];
const COLORES_NOMBRE: Record<string, string> = { negro:"#111111", blanco:"#ffffff", verde:"#22c55e", rojo:"#ef4444", azul:"#3b82f6", amarillo:"#facc15", naranja:"#f97316", rosado:"#ec4899", rosa:"#ec4899", morado:"#a855f7", gris:"#71717a", cafe:"#92400e", beige:"#d6c7a1" };

function colorHex(valor:string) {
  if (/^#[0-9a-f]{6}$/i.test(valor)) return valor;
  return COLORES_NOMBRE[valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()] ?? "#82f000";
}

export default function VariantesManager({ producto, iniciales }: { producto: Producto; iniciales: Variante[] }) {
  const router = useRouter();
  const [variantes, setVariantes] = useState(iniciales);
  const [stockSinAsignar, setStockSinAsignar] = useState(Number(producto.stock));
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(vacio);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function editar(variante: Variante) {
    setEditando(variante.id);
    setForm({ nombre:variante.nombre, color:variante.color ?? "", talla:variante.talla ?? "", sku:variante.sku, precio:variante.precio?.toString() ?? "", precio_mayorista:variante.precio_mayorista?.toString() ?? "", cantidad_minima_mayorista:variante.cantidad_minima_mayorista?.toString() ?? "", stock:String(variante.stock), imagen_url:variante.imagen_url ?? "", activo:variante.activo });
    setMensaje("");
    setEsError(false);
  }
  function cancelar(){ setEditando(null); setForm(vacio); setMensaje(""); setEsError(false); }

  async function guardar(event: FormEvent) {
    event.preventDefault(); setGuardando(true); setMensaje(""); setEsError(false);
    const stockSolicitado=Number(form.stock);
    const stockActual=editando?Number(variantes.find((item)=>item.id===editando)?.stock??0):0;
    if(!Number.isInteger(stockSolicitado)||stockSolicitado<0||stockSolicitado>stockSinAsignar+stockActual){
      setGuardando(false); setEsError(true); setMensaje(`Solo puedes asignar hasta ${stockSinAsignar+stockActual} unidades a este color.`); return;
    }
    const url = editando ? `/api/admin/variantes/${editando}` : "/api/admin/variantes";
    const respuesta = await fetch(url, { method: editando ? "PATCH" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, productoId:producto.id }) }).catch(()=>null);
    if(!respuesta){setGuardando(false);setEsError(true);setMensaje("No fue posible comunicarse con la tienda. Inténtalo nuevamente.");return;}
    const data = await respuesta.json().catch(()=>({})); setGuardando(false);
    if (!respuesta.ok) { setEsError(true); setMensaje(data.error ?? "No fue posible guardar."); return; }
    setVariantes((actual) => editando ? actual.map((item) => item.id === editando ? data.variante : item) : [...actual, data.variante]);
    if(Number.isInteger(data.stock_base))setStockSinAsignar(Number(data.stock_base));
    setEditando(null); setForm(vacio); setEsError(false); setMensaje(data.advertencia??"Guardado correctamente sin cambiar el total del inventario.");
    router.refresh();
  }

  async function eliminar(id:string) {
    const variante=variantes.find((item)=>item.id===id);
    if(variante&&Number(variante.stock)>0){setEsError(true);setMensaje("Primero edita este color y deja su stock en 0. Esas unidades regresarán al stock sin color.");return;}
    if (!window.confirm("¿Eliminar esta variante? Los pedidos anteriores conservarán su información.")) return;
    const respuesta = await fetch(`/api/admin/variantes/${id}`, { method:"DELETE" });
    const data = await respuesta.json().catch(()=>({}));
    if (!respuesta.ok) { setEsError(true); setMensaje(data.error ?? "No fue posible eliminar."); return; }
    setVariantes((actual) => actual.filter((item) => item.id !== id));
    setEsError(false); setMensaje("Color eliminado sin perder unidades."); router.refresh();
  }

  const varianteEditada=editando?variantes.find((item)=>item.id===editando):null;
  const stockActualEditado=Number(varianteEditada?.stock??0);
  const stockSolicitado=Number(form.stock)||0;
  const stockSinAsignarDespues=stockSinAsignar-(stockSolicitado-stockActualEditado);
  const stockAsignado=variantes.reduce((total,variante)=>total+(variante.controla_stock?Number(variante.stock):0),0);
  const variantesActivas=variantes.filter((variante)=>variante.activo);
  const stockDisponible=producto.activo?(variantesActivas.length>0?variantesActivas.reduce((total,variante)=>total+(variante.controla_stock?Number(variante.stock):0),0):stockSinAsignar):0;
  const stockFisico=stockSinAsignar+stockAsignado;
  const stockMaximo=stockSinAsignar+stockActualEditado;
  const campo = "w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";
  return <div className="mt-7">
    <section className="mb-6 rounded-2xl border border-lime-400/25 bg-lime-400/[0.05] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">DISTRIBUCIÓN DEL INVENTARIO</p><h2 className="mt-2 text-xl font-black">El total no cambia al repartir colores</h2></div><span className="rounded-full bg-lime-400 px-3 py-1 text-sm font-black text-black">TOTAL {stockFisico}</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Sin color todavía</p><p className="mt-1 text-2xl font-black text-amber-300">{stockSinAsignar}</p></div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Asignadas a colores</p><p className="mt-1 text-2xl font-black">{stockAsignado}</p></div>
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Disponibles en la tienda</p><p className="mt-1 text-2xl font-black text-lime-300">{stockDisponible}</p></div>
      </div>
      {stockSinAsignar>0&&variantes.length>0&&<p className="mt-3 text-sm text-amber-200">Las {stockSinAsignar} unidades sin color se conservan, pero faltan por clasificar antes de venderlas por color.</p>}
    </section>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
      <h2 className="text-xl font-black">{editando ? "Editar color u opción" : "Nuevo color u opción"}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">La cantidad que asignes se toma de las unidades sin color. Si luego bajas una cantidad, esas unidades regresan allí. El total físico siempre se conserva.</p>
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
        <label className="text-sm text-zinc-400">SKU único<input required className={`${campo} mt-2`} placeholder="CAM-NEG-M" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value.toUpperCase()})}/></label>
        <label className="text-sm text-zinc-400">Cantidad de este color<input required min="0" max={stockMaximo} type="number" className={`${campo} mt-2`} value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/><span className="mt-2 block text-xs leading-5 text-zinc-500">Puedes asignar hasta {stockMaximo}. Después quedarán <strong className={stockSinAsignarDespues<0?"text-red-300":"text-amber-300"}>{Math.max(stockSinAsignarDespues,0)} sin color</strong> y el total seguirá en {stockFisico}.</span></label>
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
      {mensaje && <p className={`mt-4 text-sm ${esError?"text-red-300":"text-lime-300"}`}>{mensaje}</p>}
      <div className="mt-5 grid gap-3 min-[400px]:flex min-[400px]:flex-wrap"><button disabled={guardando} className="min-h-12 rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>{editando && <button type="button" onClick={cancelar} className="min-h-12 rounded-xl border border-zinc-700 px-5 py-3 font-bold">Cancelar</button>}</div>
    </form>
    <section className="min-w-0 space-y-3"><h2 className="break-words text-xl font-black">Colores y opciones creadas ({variantes.length})</h2>{variantes.length === 0 ? <p className="rounded-2xl border border-zinc-800 p-6 text-zinc-400">Este producto todavía no tiene colores clasificados.</p> : variantes.map(v=><article key={v.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex flex-col gap-4 min-[460px]:flex-row min-[460px]:justify-between"><div className="flex min-w-0 gap-3"><span className="mt-0.5 h-9 w-9 shrink-0 rounded-full border-2 border-zinc-600 p-1"><span className="block h-full w-full rounded-full border border-black/20" style={{backgroundColor:colorHex(v.color ?? "")}} /></span><div className="min-w-0"><h3 className="break-words font-black">{v.nombre}</h3><p className={`mt-1 break-words text-xs font-semibold ${v.stock <= 0 ? "text-red-300" : "text-zinc-500"}`}>SKU {v.sku} · {v.stock <= 0 ? "Agotado · No seleccionable en la tienda" : `Stock ${v.stock}`} · {v.activo ? "Visible" : "Oculta"}</p><p className="mt-2 text-sm text-zinc-300">{v.talla ? `Talla ${v.talla} · ` : ""}{v.precio !== null ? `$${v.precio.toLocaleString("es-CO")}` : "Precio base"}</p>{producto.venta_mayorista && <p className="mt-1 break-words text-xs text-lime-300">Mayorista: ${Number(v.precio_mayorista ?? producto.precio_mayorista).toLocaleString("es-CO")} desde {v.cantidad_minima_mayorista ?? producto.cantidad_minima_mayorista} unidades</p>}</div></div><div className="grid shrink-0 grid-cols-2 gap-2 min-[460px]:flex"><button onClick={()=>editar(v)} className="min-h-11 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400">Editar</button><button onClick={()=>eliminar(v.id)} className="min-h-11 rounded-lg border border-red-900 px-3 py-2 text-xs font-bold text-red-300">Eliminar</button></div></div></article>)}</section>
    </div>
  </div>;
}
