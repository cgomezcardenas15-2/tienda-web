"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorStockNuevo } from "@/app/lib/coloresProducto";
import ColorStockFields from "./ColorStockFields";
import ImageUploader from "./ImageUploader";

type ProductoEditable = {
  id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  categoria: string;
  subcategoria_id: string | null;
  precio: number;
  precio_anterior: number | null;
  venta_mayorista: boolean;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  destacado: boolean;
  en_oferta: boolean;
  activo: boolean;
};

type CategoriaOpcion = { id: string; nombre: string; activo: boolean };
type SubcategoriaOpcion = { id: string; categoria_id: string; nombre: string; activo: boolean };

export default function ProductoForm({
  producto,
  categorias,
  subcategorias,
  tieneVariantes = false,
}: {
  producto?: ProductoEditable;
  categorias: CategoriaOpcion[];
  subcategorias: SubcategoriaOpcion[];
  tieneVariantes?: boolean;
}) {
  const router = useRouter();
  const [tieneColores, setTieneColores] = useState(false);
  const [colores, setColores] = useState<ColorStockNuevo[]>([]);
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    sku: producto?.sku ?? "",
    descripcion: producto?.descripcion ?? "",
    categoria: producto?.categoria ?? categorias[0]?.nombre ?? "",
    subcategoria_id: producto?.subcategoria_id ?? "",
    precio: producto ? String(producto.precio) : "",
    precio_anterior: producto?.precio_anterior === null || producto?.precio_anterior === undefined ? "" : String(producto.precio_anterior),
    venta_mayorista: producto?.venta_mayorista ?? false,
    precio_mayorista: producto?.precio_mayorista == null ? "" : String(producto.precio_mayorista),
    cantidad_minima_mayorista: producto?.cantidad_minima_mayorista == null ? "" : String(producto.cantidad_minima_mayorista),
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
  const categoriaSeleccionada = categorias.find((categoria) => categoria.nombre === form.categoria);
  const subcategoriasDisponibles = subcategorias.filter((subcategoria) => (
    subcategoria.categoria_id === categoriaSeleccionada?.id
    && (subcategoria.activo || subcategoria.id === form.subcategoria_id)
  ));

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setEsError(false);

    if (!producto && tieneColores && colores.length === 0) {
      setGuardando(false);
      setEsError(true);
      setMensaje("Selecciona al menos un color y asigna sus existencias.");
      return;
    }
    if (!producto && tieneColores) {
      const nombres = colores.map((item) => item.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
      const tonos = colores.map((item) => item.color.toLowerCase());
      if (new Set(nombres).size !== nombres.length || new Set(tonos).size !== tonos.length) {
        setGuardando(false);
        setEsError(true);
        setMensaje("No repitas nombres ni tonos dentro del mismo producto.");
        return;
      }
    }

    const respuesta = await fetch(
      producto ? `/api/admin/productos/${producto.id}` : "/api/admin/productos",
      {
        method: producto ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          controla_stock: tieneColores ? true : form.controla_stock,
          stock: tieneColores ? "0" : form.stock,
          usa_variantes: !producto && tieneColores,
          variantes: !producto && tieneColores ? colores : [],
        }),
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
    <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
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
          <select className={`${campo} cursor-pointer`} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value, subcategoria_id: "" })}>
            {categorias.map((categoria) => <option key={categoria.nombre} value={categoria.nombre}>{categoria.nombre}{categoria.activo ? "" : " (inactiva)"}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-400">Subcategoría (opcional)
          <select
            className={`${campo} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
            value={form.subcategoria_id}
            disabled={subcategoriasDisponibles.length === 0}
            onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}
          >
            <option value="">{subcategoriasDisponibles.length === 0 ? "Sin subcategorías disponibles" : "Sin subcategoría"}</option>
            {subcategoriasDisponibles.map((subcategoria) => (
              <option key={subcategoria.id} value={subcategoria.id}>
                {subcategoria.nombre}{subcategoria.activo ? "" : " (inactiva)"}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs leading-5 text-zinc-500">Sirve para filtrar dentro de {form.categoria}; no cambia las existencias.</span>
        </label>
        <label className="text-sm text-zinc-400">Precio de venta
          <input required min="0" step="1" type="number" className={campo} value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="29900" />
        </label>
        <label className="text-sm text-zinc-400">Precio anterior (opcional)
          <input min="0" step="1" type="number" className={campo} value={form.precio_anterior} onChange={(e) => setForm({ ...form, precio_anterior: e.target.value })} placeholder="39900" />
        </label>
        {!producto && <section className="sm:col-span-2 rounded-2xl border border-zinc-700 bg-black/30 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={tieneColores}
              onChange={(event) => {
                if (!event.target.checked && colores.length > 0 && !window.confirm("¿Quitar los colores agregados y volver a manejar un solo stock?")) return;
                setTieneColores(event.target.checked);
                if (event.target.checked) setForm((actual) => ({ ...actual, controla_stock: true }));
                else setColores([]);
              }}
            />
            <span>
              <strong className="block text-sm text-white">Este producto viene en varios colores</strong>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">Podrás escoger los tonos y definir cuántas unidades hay de cada uno antes de crear el producto.</span>
            </span>
          </label>
        </section>}
        {(!tieneColores || producto) && <label className="text-sm text-zinc-400">{tieneVariantes ? "Stock sin color" : "Stock base"}
          <input required min="0" step="1" type="number" disabled={!form.controla_stock || tieneVariantes} className={`${campo} disabled:cursor-not-allowed disabled:opacity-60`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          {tieneVariantes && <span className="mt-2 block text-xs leading-5 text-amber-200">Estas unidades todavía no están asignadas a un color. Distribúyelas en la sección de abajo; así el total no cambia.</span>}
        </label>}
        {!producto && tieneColores && (
          <ColorStockFields skuBase={form.sku} colores={colores} onChange={setColores} />
        )}
        {form.venta_mayorista && <>
          <label className="text-sm text-zinc-400">Precio mayorista por unidad
            <input required min="0" step="1" type="number" className={campo} value={form.precio_mayorista} onChange={(e) => setForm({ ...form, precio_mayorista: e.target.value })} placeholder="Ej: 11900" />
          </label>
          <label className="text-sm text-zinc-400">Cantidad mínima mayorista
            <input required min="2" step="1" type="number" className={campo} value={form.cantidad_minima_mayorista} onChange={(e) => setForm({ ...form, cantidad_minima_mayorista: e.target.value })} placeholder="Ej: 6" />
          </label>
        </>}
        <label className="sm:col-span-2 text-sm text-zinc-400">Descripción
          <textarea required rows={4} className={`${campo} resize-y`} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe sus características, medidas y utilidad." />
        </label>
        <ImageUploader
          value={form.imagen_url}
          onChange={(imagen_url) => setForm({ ...form, imagen_url })}
        />
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4 sm:grid-cols-2">
        <label className={`flex items-center gap-3 text-sm ${tieneColores || tieneVariantes ? "cursor-not-allowed text-zinc-500" : "cursor-pointer"}`}><input type="checkbox" disabled={tieneColores || tieneVariantes} checked={tieneColores || tieneVariantes || form.controla_stock} onChange={(e) => setForm({ ...form, controla_stock: e.target.checked })} /> {tieneColores || tieneVariantes ? "Controlar existencias por color" : "Controlar existencias"}</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} /> Mostrar como destacado</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.en_oferta} onChange={(e) => setForm({ ...form, en_oferta: e.target.checked })} /> Marcar como oferta</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Mostrar producto en la tienda</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.venta_mayorista} onChange={(e) => setForm({ ...form, venta_mayorista: e.target.checked, precio_mayorista: e.target.checked ? form.precio_mayorista : "", cantidad_minima_mayorista: e.target.checked ? form.cantidad_minima_mayorista : "" })} /> Ofrecer precio mayorista</label>
      </div>

      {!form.activo && <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">El producto quedará suspendido: conservará sus datos, pero no aparecerá ni podrá comprarse.</p>}
      {mensaje && <p className={`mt-4 text-sm ${esError ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
      <button disabled={guardando} className="mt-6 cursor-pointer rounded-xl bg-lime-400 px-6 py-3 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">
        {guardando ? "Guardando..." : producto ? "Guardar cambios" : tieneColores ? "Crear producto con colores" : "Crear producto"}
      </button>
    </form>
  );
}
