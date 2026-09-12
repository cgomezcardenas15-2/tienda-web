"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Proveedor = { id: string; nombre: string; tipo_documento: string; numero_documento: string | null; persona_contacto: string | null; correo: string | null; telefono: string | null; pais: string; ciudad: string | null; sitio_web: string | null; moneda: string; notas: string | null; activo: boolean };

export default function ProveedorEditor({ proveedor }: { proveedor: Proveedor }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function enviar(datos: Record<string, unknown>) {
    setProcesando(true); setMensaje("");
    const respuesta = await fetch(`/api/admin/proveedores/${proveedor.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
    const resultado = await respuesta.json();
    setProcesando(false);
    if (!respuesta.ok) { setMensaje(resultado.error || "No fue posible actualizar el proveedor."); return false; }
    setMensaje("Proveedor actualizado correctamente."); router.refresh(); return true;
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await enviar(Object.fromEntries(new FormData(evento.currentTarget)));
  }

  return <>
    <form onSubmit={guardar} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-zinc-300 sm:col-span-2">Nombre o empresa<input required name="nombre" defaultValue={proveedor.nombre} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Tipo de documento<select name="tipo_documento" defaultValue={proveedor.tipo_documento} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4"><option>NIT</option><option>CC</option><option>CE</option><option>PAS</option><option>OTRO</option></select></label>
      <label className="text-sm text-zinc-300">Número de documento<input name="numero_documento" defaultValue={proveedor.numero_documento || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Persona de contacto<input name="persona_contacto" defaultValue={proveedor.persona_contacto || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Teléfono<input name="telefono" inputMode="tel" defaultValue={proveedor.telefono || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Correo<input name="correo" type="email" defaultValue={proveedor.correo || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Sitio web<input name="sitio_web" type="url" placeholder="https://" defaultValue={proveedor.sitio_web || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">País<input required name="pais" defaultValue={proveedor.pais} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Ciudad<input name="ciudad" defaultValue={proveedor.ciudad || ""} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4" /></label>
      <label className="text-sm text-zinc-300">Moneda principal<select name="moneda" defaultValue={proveedor.moneda} className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4"><option>COP</option><option>USD</option><option>CNY</option><option>EUR</option></select></label>
      <label className="text-sm text-zinc-300 sm:col-span-2">Notas<textarea name="notas" rows={4} defaultValue={proveedor.notas || ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-4" /></label>
      {mensaje ? <p className={`text-sm font-bold sm:col-span-2 ${mensaje.includes("correctamente") ? "text-lime-400" : "text-red-300"}`}>{mensaje}</p> : null}
      <button disabled={procesando} className="min-h-12 rounded-xl bg-[#82f000] px-6 font-black text-black disabled:opacity-50 sm:col-span-2">{procesando ? "Guardando..." : "Guardar cambios"}</button>
    </form>
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/40 p-5">
      <h2 className="font-black">Estado del proveedor</h2>
      <p className="mt-2 text-sm text-zinc-400">Suspenderlo conserva su información, pero indica que no debe utilizarse para nuevas compras.</p>
      <button type="button" disabled={procesando} onClick={() => enviar({ activo: !proveedor.activo })} className={`mt-4 min-h-11 rounded-xl border px-5 font-black ${proveedor.activo ? "border-amber-500 text-amber-300" : "border-lime-400 text-lime-300"}`}>{proveedor.activo ? "Suspender proveedor" : "Reactivar proveedor"}</button>
    </div>
  </>;
}
