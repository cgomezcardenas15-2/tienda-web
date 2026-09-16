"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Linea={id:string;nombre:string;variante:string|null;cantidad:number};
export default function NuevaDevolucionForm({pedidoId,lineas}:{pedidoId:string;lineas:Linea[]}){
  const router=useRouter();const [abierto,setAbierto]=useState(false);const [guardando,setGuardando]=useState(false);const [error,setError]=useState("");
  async function guardar(e:FormEvent<HTMLFormElement>){e.preventDefault();setGuardando(true);setError("");const f=new FormData(e.currentTarget);const seleccionadas=lineas.map(l=>({producto_pedido_id:l.id,cantidad:Number(f.get(`cantidad-${l.id}`)||0)})).filter(l=>l.cantidad>0);
    const respuesta=await fetch("/api/admin/devoluciones",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pedido_id:pedidoId,tipo:f.get("tipo"),motivo:f.get("motivo"),detalle:f.get("detalle"),valor_reembolso:f.get("valor_reembolso"),lineas:seleccionadas})});const resultado=await respuesta.json().catch(()=>null) as {error?:string;id?:string}|null;setGuardando(false);if(!respuesta.ok){setError(resultado?.error||"No fue posible crear el caso.");return;}router.push(`/admin/devoluciones/${resultado?.id}`);router.refresh();}
  if(!abierto)return <button onClick={()=>setAbierto(true)} className="mt-4 min-h-11 rounded-xl bg-lime-400 px-5 font-black text-black hover:bg-lime-300">Crear caso</button>;
  const campo="mt-2 min-h-11 w-full rounded-xl border border-zinc-700 bg-black px-4 text-white outline-none focus:border-lime-400";
  return <form onSubmit={guardar} className="mt-5 grid gap-4 sm:grid-cols-2">
    <label className="text-sm text-zinc-300">Tipo<select name="tipo" className={campo}><option value="devolucion">Devolución</option><option value="garantia">Garantía</option><option value="reembolso">Solo reembolso</option></select></label>
    <label className="text-sm text-zinc-300">Valor a reembolsar<input name="valor_reembolso" type="number" min="0" step="1" defaultValue="0" className={campo}/></label>
    <fieldset className="sm:col-span-2"><legend className="text-sm font-bold text-zinc-300">Productos y cantidades</legend><div className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">{lineas.map(l=><label key={l.id} className="grid grid-cols-[1fr_100px] items-center gap-3 p-3 text-sm"><span><strong>{l.nombre}</strong>{l.variante&&<span className="ml-2 text-lime-400">{l.variante}</span>}<small className="block text-zinc-500">Comprado: {l.cantidad}</small></span><input aria-label={`Cantidad de ${l.nombre}`} name={`cantidad-${l.id}`} type="number" min="0" max={l.cantidad} defaultValue="0" className="min-h-10 rounded-lg border border-zinc-700 bg-black px-3"/></label>)}</div></fieldset>
    <label className="text-sm text-zinc-300 sm:col-span-2">Motivo<input required minLength={5} maxLength={500} name="motivo" placeholder="Ejemplo: el producto llegó con una pieza defectuosa" className={campo}/></label>
    <label className="text-sm text-zinc-300 sm:col-span-2">Detalle adicional<textarea name="detalle" rows={3} className={`${campo} py-3`}/></label>
    {error&&<p role="alert" className="font-bold text-red-300 sm:col-span-2">{error}</p>}
    <div className="flex gap-3 sm:col-span-2"><button disabled={guardando} className="min-h-11 rounded-xl bg-lime-400 px-5 font-black text-black disabled:opacity-50">{guardando?"Creando...":"Guardar caso"}</button><button type="button" onClick={()=>setAbierto(false)} className="rounded-xl border border-zinc-700 px-5 font-bold">Cancelar</button></div>
  </form>;
}
