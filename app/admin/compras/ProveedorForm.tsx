"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProveedorForm() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));
    const respuesta = await fetch("/api/admin/proveedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
    const resultado = await respuesta.json();
    setGuardando(false);
    if (!respuesta.ok) { setMensaje(resultado.error || "No fue posible guardar el proveedor."); return; }
    formulario.reset();
    setMensaje("Proveedor guardado correctamente.");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-zinc-300 sm:col-span-2">Nombre o empresa<input required name="nombre" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Tipo de documento<select name="tipo_documento" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base"><option>NIT</option><option>CC</option><option>CE</option><option>PAS</option><option>OTRO</option></select></label>
      <label className="text-sm text-zinc-300">Número de documento<input name="numero_documento" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Persona de contacto<input name="persona_contacto" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Teléfono<input name="telefono" inputMode="tel" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Correo<input name="correo" type="email" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Sitio web<input name="sitio_web" type="url" placeholder="https://" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">País<input required name="pais" defaultValue="Colombia" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Ciudad<input name="ciudad" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base outline-none focus:border-lime-400" /></label>
      <label className="text-sm text-zinc-300">Moneda principal<select name="moneda" className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-black px-4 text-base"><option>COP</option><option>USD</option><option>CNY</option><option>EUR</option></select></label>
      <label className="text-sm text-zinc-300 sm:col-span-2">Notas<textarea name="notas" rows={3} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-4 text-base outline-none focus:border-lime-400" /></label>
      {mensaje ? <p className={`text-sm font-bold sm:col-span-2 ${mensaje.includes("correctamente") ? "text-lime-400" : "text-red-300"}`}>{mensaje}</p> : null}
      <button disabled={guardando} className="min-h-12 rounded-xl bg-[#82f000] px-6 font-black text-black disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{guardando ? "Guardando..." : "Guardar proveedor"}</button>
    </form>
  );
}
