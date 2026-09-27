"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoriaProducto } from "@/app/lib/categoriasProducto";

type CategoriaAdmin = CategoriaProducto & { productos: number };
const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

export default function CategoriasManager({ iniciales }: { iniciales: CategoriaAdmin[] }) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreando(true); setMensaje("");
    const form = event.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const respuesta = await fetch("/api/admin/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...datos, activo: true }) });
    const data = await respuesta.json().catch(() => ({})); setCreando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible crear la categoría.");
    form.reset(); setMensaje("Categoría creada correctamente."); router.refresh();
  }

  return <div className="mt-8 grid gap-7 lg:grid-cols-[340px_1fr]">
    <form onSubmit={crear} className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-xl font-black">Nueva categoría</h2>
      <label className="mt-5 block text-sm text-zinc-400">Nombre<input required name="nombre" className={campo} placeholder="Ej: Tecnología" /></label>
      <label className="mt-4 block text-sm text-zinc-400">Icono<input required name="icono" className={campo} defaultValue="📦" maxLength={8} /></label>
      <label className="mt-4 block text-sm text-zinc-400">Descripción<textarea required name="descripcion" rows={3} className={`${campo} resize-y`} placeholder="Qué productos encontrará el cliente" /></label>
      <label className="mt-4 block text-sm text-zinc-400">Orden<input required name="orden" type="number" min="0" step="1" defaultValue="60" className={campo} /></label>
      {mensaje && <p className="mt-4 text-sm text-amber-200">{mensaje}</p>}
      <button disabled={creando} className="mt-5 w-full rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{creando ? "Creando..." : "Crear categoría"}</button>
    </form>
    <section className="space-y-4">
      {iniciales.map((categoria) => <CategoriaEditor key={categoria.id} categoria={categoria} />)}
    </section>
  </div>;
}

function CategoriaEditor({ categoria }: { categoria: CategoriaAdmin }) {
  const router = useRouter();
  const [form, setForm] = useState(categoria);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  async function guardar(event: FormEvent) {
    event.preventDefault(); setGuardando(true); setMensaje("");
    const respuesta = await fetch(`/api/admin/categorias/${categoria.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await respuesta.json().catch(() => ({})); setGuardando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible guardar.");
    setMensaje("Cambios guardados."); router.refresh();
  }
  return <form onSubmit={guardar} className={`rounded-2xl border p-5 ${form.activo ? "border-zinc-800 bg-zinc-900" : "border-amber-500/20 bg-amber-500/5"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{form.icono} {form.nombre}</h2><p className="mt-1 text-xs text-zinc-500">/{form.slug} · {categoria.productos} productos</p></div><label className="flex cursor-pointer items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> {form.activo ? "Visible" : "Oculta"}</label></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_90px_110px]"><label className="text-sm text-zinc-400">Nombre<input required className={campo} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label><label className="text-sm text-zinc-400">Icono<input required maxLength={8} className={campo} value={form.icono} onChange={(e) => setForm({ ...form, icono: e.target.value })} /></label><label className="text-sm text-zinc-400">Orden<input required type="number" min="0" className={campo} value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} /></label></div>
    <label className="mt-4 block text-sm text-zinc-400">Descripción<input required className={campo} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
    {!form.activo && <p className="mt-4 text-xs text-amber-200">Los productos quedan guardados, pero esta sección no aparece en la tienda.</p>}
    <div className="mt-4 flex items-center gap-3"><button disabled={guardando} className="rounded-xl bg-lime-400 px-5 py-2.5 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>{mensaje && <span className="text-sm text-lime-300">{mensaje}</span>}</div>
  </form>;
}

