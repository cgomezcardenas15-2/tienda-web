"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoriaProducto, SubcategoriaProducto } from "@/app/lib/categoriasProducto";

type CategoriaAdmin = CategoriaProducto & { productos: number };
type SubcategoriaAdmin = SubcategoriaProducto & { productos: number };

const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

export default function CategoriasManager({
  iniciales,
  subcategorias,
}: {
  iniciales: CategoriaAdmin[];
  subcategorias: SubcategoriaAdmin[];
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreando(true);
    setMensaje("");
    const form = event.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const respuesta = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, activo: true }),
    });
    const data = await respuesta.json().catch(() => ({}));
    setCreando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible crear la categoría.");
    form.reset();
    setMensaje("Categoría creada correctamente.");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-7 lg:grid-cols-[340px_1fr]">
      <form onSubmit={crear} className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-xl font-black">Nueva categoría</h2>
        <label className="mt-5 block text-sm text-zinc-400">Nombre<input required name="nombre" className={campo} placeholder="Ej: Tecnología" /></label>
        <label className="mt-4 block text-sm text-zinc-400">Icono<input required name="icono" className={campo} defaultValue="📦" maxLength={8} /></label>
        <label className="mt-4 block text-sm text-zinc-400">Descripción<textarea required name="descripcion" rows={3} className={`${campo} resize-y`} placeholder="Qué productos encontrará el cliente" /></label>
        <label className="mt-4 block text-sm text-zinc-400">Orden<input required name="orden" type="number" min="0" step="1" defaultValue="60" className={campo} /></label>
        {mensaje && <p className="mt-4 text-sm text-amber-200">{mensaje}</p>}
        <button disabled={creando} className="mt-5 w-full rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{creando ? "Creando..." : "Crear categoría"}</button>
      </form>

      <section className="space-y-5">
        {iniciales.map((categoria) => (
          <article key={categoria.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <CategoriaEditor categoria={categoria} />
            <SubcategoriasPanel
              categoria={categoria}
              iniciales={subcategorias.filter((subcategoria) => subcategoria.categoria_id === categoria.id)}
            />
          </article>
        ))}
      </section>
    </div>
  );
}

function CategoriaEditor({ categoria }: { categoria: CategoriaAdmin }) {
  const router = useRouter();
  const [form, setForm] = useState(categoria);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    const respuesta = await fetch(`/api/admin/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible guardar.");
    setMensaje("Cambios guardados.");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className={`p-5 ${form.activo ? "bg-zinc-900" : "bg-amber-500/5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{form.icono} {form.nombre}</h2>
          <p className="mt-1 text-xs text-zinc-500">/{form.slug} · {categoria.productos} productos</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          {form.activo ? "Visible" : "Oculta"}
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_90px_110px]">
        <label className="text-sm text-zinc-400">Nombre<input required className={campo} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
        <label className="text-sm text-zinc-400">Icono<input required maxLength={8} className={campo} value={form.icono} onChange={(e) => setForm({ ...form, icono: e.target.value })} /></label>
        <label className="text-sm text-zinc-400">Orden<input required type="number" min="0" className={campo} value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} /></label>
      </div>
      <label className="mt-4 block text-sm text-zinc-400">Descripción<input required className={campo} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
      {!form.activo && <p className="mt-4 text-xs text-amber-200">Los productos quedan guardados, pero esta sección no aparece en la tienda.</p>}
      <div className="mt-4 flex items-center gap-3">
        <button disabled={guardando} className="rounded-xl bg-lime-400 px-5 py-2.5 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
        {mensaje && <span className="text-sm text-lime-300">{mensaje}</span>}
      </div>
    </form>
  );
}

function SubcategoriasPanel({
  categoria,
  iniciales,
}: {
  categoria: CategoriaAdmin;
  iniciales: SubcategoriaAdmin[];
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreando(true);
    setMensaje("");
    const form = event.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const respuesta = await fetch("/api/admin/subcategorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, categoria_id: categoria.id }),
    });
    const data = await respuesta.json().catch(() => ({}));
    setCreando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible crear la subcategoría.");
    form.reset();
    setMensaje("Subcategoría creada.");
    router.refresh();
  }

  return (
    <section className="border-t border-zinc-800 bg-black/25 p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-400">Subcategorías</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">Organizan los productos dentro de {categoria.nombre}. No modifican inventario, colores ni pedidos.</p>
      </div>

      <form onSubmit={crear} className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4 md:grid-cols-[1fr_1fr_90px_auto] md:items-end">
        <label className="text-xs text-zinc-400">Nombre<input required maxLength={80} name="nombre" className={campo} placeholder="Ej: Luces" /></label>
        <label className="text-xs text-zinc-400">Descripción opcional<input maxLength={180} name="descripcion" className={campo} placeholder="Qué incluye" /></label>
        <label className="text-xs text-zinc-400">Orden<input required name="orden" type="number" min="0" step="1" defaultValue="10" className={campo} /></label>
        <button disabled={creando} className="min-h-12 rounded-xl border border-lime-400 px-4 font-black text-lime-300 transition hover:bg-lime-400 hover:text-black disabled:opacity-50">{creando ? "Creando..." : "Agregar"}</button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-amber-200">{mensaje}</p>}

      <div className="mt-4 space-y-3">
        {iniciales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-sm text-zinc-500">Todavía no hay subcategorías. Los productos seguirán apareciendo normalmente en {categoria.nombre}.</p>
        ) : iniciales.map((subcategoria) => (
          <SubcategoriaEditor key={subcategoria.id} subcategoria={subcategoria} />
        ))}
      </div>
    </section>
  );
}

function SubcategoriaEditor({ subcategoria }: { subcategoria: SubcategoriaAdmin }) {
  const router = useRouter();
  const [form, setForm] = useState(subcategoria);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    const respuesta = await fetch(`/api/admin/subcategorias/${subcategoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);
    if (!respuesta.ok) return setMensaje(data.error ?? "No fue posible guardar.");
    setMensaje("Guardada.");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className={`rounded-xl border p-4 ${form.activo ? "border-zinc-800 bg-zinc-900/70" : "border-amber-500/20 bg-amber-500/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black">{form.nombre}</p>
          <p className="mt-1 text-xs text-zinc-500">/{form.slug} · {subcategoria.productos} productos</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          {form.activo ? "Visible" : "Oculta"}
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_90px_auto] md:items-end">
        <label className="text-xs text-zinc-400">Nombre<input required maxLength={80} className={campo} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">Descripción<input maxLength={180} className={campo} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">Orden<input required type="number" min="0" className={campo} value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} /></label>
        <button disabled={guardando} className="min-h-12 rounded-xl bg-zinc-800 px-4 font-black text-white transition hover:bg-lime-400 hover:text-black disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
      </div>
      {!form.activo && <p className="mt-3 text-xs text-amber-200">Se oculta el filtro, pero sus productos continúan visibles al seleccionar “Todos”.</p>}
      {mensaje && <p className="mt-3 text-xs text-lime-300">{mensaje}</p>}
    </form>
  );
}
