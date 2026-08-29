"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProductoEditable = {
  id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  categoria: string;
  precio: number;
  precio_anterior: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  destacado: boolean;
  en_oferta: boolean;
  activo: boolean;
};

const CATEGORIAS = ["Piñatería", "Hogar", "Mascotas"];

export default function ProductoForm({ producto }: { producto?: ProductoEditable }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    sku: producto?.sku ?? "",
    descripcion: producto?.descripcion ?? "",
    categoria: producto?.categoria ?? "Hogar",
    precio: producto ? String(producto.precio) : "",
    precio_anterior: producto?.precio_anterior === null || producto?.precio_anterior === undefined ? "" : String(producto.precio_anterior),
    controla_stock: producto?.controla_stock ?? true,
    stock: producto ? String(producto.stock) : "0",
    imagen_url: producto?.imagen_url ?? "",
    destacado: producto?.destacado ?? false,
    en_oferta: producto?.en_oferta ?? false,
    activo: producto?.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setEsError(false);

    const respuesta = await fetch(
      producto ? `/api/admin/productos/${producto.id}` : "/api/admin/productos",
      {
        method: producto ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);

    if (!respuesta.ok) {
      setEsError(true);
      setMensaje(data.error ?? "No fue posible guardar el producto.");
      return;
    }

    setMensaje(producto ? "Producto actualizado correctamente." : "Producto creado correctamente.");
    if (!producto && data.producto?.id) {
      router.push(`/admin/productos/${data.producto.id}`);
      return;
    }
    router.refresh();
  }

  const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

  return (
    <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{producto ? "Información del producto" : "Crear producto"}</h2>
          <p className="mt-1 text-sm text-zinc-500">Los cambios visibles se reflejan en el catálogo de la tienda.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${form.activo ? "bg-lime-400/15 text-lime-300" : "bg-amber-400/15 text-amber-300"}`}>
          {form.activo ? "VISIBLE" : "SUSPENDIDO"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">Nombre del producto
          <input required className={campo} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Organizador para cocina" />
        </label>
        <label className="text-sm text-zinc-400">SKU único
          <input required className={campo} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="HOG-ORG-001" />
        </label>
        <label className="text-sm text-zinc-400">Categoría
          <select className={`${campo} cursor-pointer`} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS.map((categoria) => <option key={categoria}>{categoria}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-400">Precio de venta
          <input required min="0" step="1" type="number" className={campo} value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="29900" />
        </label>
        <label className="text-sm text-zinc-400">Precio anterior (opcional)
          <input min="0" step="1" type="number" className={campo} value={form.precio_anterior} onChange={(e) => setForm({ ...form, precio_anterior: e.target.value })} placeholder="39900" />
        </label>
        <label className="text-sm text-zinc-400">Stock base
          <input required min="0" step="1" type="number" disabled={!form.controla_stock} className={`${campo} disabled:opacity-40`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </label>
        <label className="sm:col-span-2 text-sm text-zinc-400">Descripción
          <textarea required rows={4} className={`${campo} resize-y`} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe sus características, medidas y utilidad." />
        </label>
        <label className="sm:col-span-2 text-sm text-zinc-400">URL de la fotografía (opcional)
          <input type="url" className={campo} value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://..." />
        </label>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.controla_stock} onChange={(e) => setForm({ ...form, controla_stock: e.target.checked })} /> Controlar existencias</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} /> Mostrar como destacado</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.en_oferta} onChange={(e) => setForm({ ...form, en_oferta: e.target.checked })} /> Marcar como oferta</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Mostrar producto en la tienda</label>
      </div>

      {!form.activo && <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">El producto quedará suspendido: conservará sus datos, pero no aparecerá ni podrá comprarse.</p>}
      {mensaje && <p className={`mt-4 text-sm ${esError ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
      <button disabled={guardando} className="mt-6 cursor-pointer rounded-xl bg-lime-400 px-6 py-3 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">
        {guardando ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
