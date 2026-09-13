"use client";
import { FormEvent, useState } from "react";

type Opcion={valor:string;etiqueta:string;stock:number};
export default function AjusteInventarioForm({opciones}:{opciones:Opcion[]}){
  const [mensaje,setMensaje]=useState("");
  const [error,setError]=useState("");
  const [guardando,setGuardando]=useState(false);
  async function guardar(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setGuardando(true);setError("");setMensaje("");
    const formulario=event.currentTarget;
    const form=new FormData(formulario);const [producto_id,variante_id]=String(form.get("opcion")||"").split("|");
    const respuesta=await fetch("/api/admin/inventario/ajustes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({producto_id,variante_id:variante_id||null,tipo:form.get("tipo"),cantidad:form.get("cantidad"),motivo:form.get("motivo")})});
    const resultado=await respuesta.json().catch(()=>null) as {error?:string}|null;
    if(!respuesta.ok){setError(resultado?.error||"No fue posible registrar el ajuste.");setGuardando(false);return;}
    formulario.reset();setGuardando(false);setMensaje("Ajuste registrado correctamente.");window.location.reload();
  }
  const campo="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-white outline-none focus:border-lime-400";
  return <form onSubmit={guardar} className="mt-5 grid gap-4 sm:grid-cols-2">
    <label className="text-sm text-zinc-300 sm:col-span-2">Producto o variante<select required name="opcion" defaultValue="" className={campo}><option value="" disabled>Selecciona la existencia exacta</option>{opciones.map(o=><option key={o.valor} value={o.valor}>{o.etiqueta} · Stock actual: {o.stock}</option>)}</select></label>
    <label className="text-sm text-zinc-300">Tipo de ajuste<select required name="tipo" defaultValue="" className={campo}><option value="" disabled>Selecciona el motivo general</option><option value="correccion_entrada">Corrección: agregar unidades</option><option value="correccion_salida">Corrección: retirar unidades</option><option value="danio">Mercancía dañada</option><option value="perdida">Pérdida o faltante</option><option value="devolucion_proveedor">Devolución al proveedor</option></select></label>
    <label className="text-sm text-zinc-300">Cantidad<input required name="cantidad" type="number" min="1" step="1" className={campo}/></label>
    <label className="text-sm text-zinc-300 sm:col-span-2">Explicación<textarea required name="motivo" minLength={5} maxLength={500} rows={3} placeholder="Ejemplo: dos unidades dañadas durante el transporte" className={`${campo} py-3`}/></label>
    {error&&<p role="alert" className="text-sm font-bold text-red-300 sm:col-span-2">{error}</p>}{mensaje&&<p className="text-sm font-bold text-lime-300 sm:col-span-2">{mensaje}</p>}
    <button disabled={guardando||opciones.length===0} className="min-h-12 rounded-xl bg-lime-400 px-5 font-black text-black hover:bg-lime-300 disabled:opacity-50 sm:col-span-2">{guardando?"Registrando...":"Registrar ajuste"}</button>
  </form>;
}
