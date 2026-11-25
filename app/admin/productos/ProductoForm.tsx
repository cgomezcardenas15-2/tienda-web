"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorStockNuevo, CombinacionStockNueva } from "@/app/lib/coloresProducto";
import ColorStockFields from "./ColorStockFields";
import CombinacionesStockFields, { ColorCombinacionNuevo } from "./CombinacionesStockFields";
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
  const [modoNuevo, setModoNuevo] = useState<"simple" | "colores" | "tallas" | "color_tallas">("simple");
  const tieneColores = modoNuevo === "colores";
  const tieneTallas = modoNuevo === "tallas";
  const tieneColorTallas = modoNuevo === "color_tallas";
  const tendraOpciones = modoNuevo !== "simple";
  const [colores, setColores] = useState<ColorStockNuevo[]>([]);
  const [coloresCombinacion, setColoresCombinacion] = useState<ColorCombinacionNuevo[]>([]);
  const [combinaciones, setCombinaciones] = useState<CombinacionStockNueva[]>([]);
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

    const variantesNuevas = tieneColores
      ? colores.map(({ nombre, color, stock }) => ({ nombre, color, talla: null, stock }))
      : (tieneTallas || tieneColorTallas)
        ? combinaciones.map(({ nombre, color, talla, stock }) => ({ nombre, color, talla, stock }))
        : [];

    if (!producto && tendraOpciones && variantesNuevas.length === 0) {
      setGuardando(false);
      setEsError(true);
      setMensaje(tieneColores
        ? "Selecciona al menos un color y asigna sus existencias."
        : tieneColorTallas
          ? "Selecciona al menos un color, una talla y asigna sus existencias."
          : "Selecciona al menos una talla y asigna sus existencias.");
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
    if (!producto && tieneColorTallas) {
      const nombres = coloresCombinacion.map((item) => item.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
      const tonos = coloresCombinacion.map((item) => item.color.toLowerCase());
      if (new Set(nombres).size !== nombres.length || new Set(tonos).size !== tonos.length) {
        setGuardando(false);
        setEsError(true);
        setMensaje("No repitas nombres ni tonos dentro del mismo producto.");
        return;
      }
      const colorSinTallas = coloresCombinacion.find((color) => !combinaciones.some((item) => item.colorId === color.id));
      if (colorSinTallas) {
        setGuardando(false);
        setEsError(true);
        setMensaje(`Selecciona al menos una talla para el color ${colorSinTallas.nombre || "sin nombre"}.`);
        return;
      }
    }
    if (!producto && (tieneTallas || tieneColorTallas)) {
      const opcionesUsadas = new Set<string>();
      for (const item of combinaciones) {
        const talla = item.talla.trim();
        const nombre = item.nombre.trim();
        const stock = item.stock.trim() === "" ? Number.NaN : Number(item.stock);
        const clave = `${item.color?.toLowerCase() ?? ""}|${talla.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}`;
        if (!talla || !nombre || !Number.isSafeInteger(stock) || stock < 0) {
          setGuardando(false);
          setEsError(true);
          setMensaje("Revisa que cada talla tenga nombre y una cantidad válida de cero o más unidades.");
          return;
        }
        if (opcionesUsadas.has(clave)) {
          setGuardando(false);
          setEsError(true);
          setMensaje("No repitas la misma talla dentro de un mismo color.");
          return;
        }
        opcionesUsadas.add(clave);
      }
    }

    const respuesta = await fetch(
      producto ? `/api/admin/productos/${producto.id}` : "/api/admin/productos",
      {
        method: producto ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          controla_stock: tendraOpciones ? true : form.controla_stock,
          stock: tendraOpciones ? "0" : form.stock,
          usa_variantes: !producto && tendraOpciones,
          variantes: !producto && tendraOpciones ? variantesNuevas : [],
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

  function cambiarModo(nuevoModo: typeof modoNuevo) {
    if (nuevoModo === modoNuevo) return;
    const hayOpcionesCargadas = colores.length > 0 || coloresCombinacion.length > 0 || combinaciones.length > 0;
    if (hayOpcionesCargadas && !window.confirm("¿Quitar las opciones agregadas y cambiar el tipo de producto?")) return;
    setColores([]);
    setColoresCombinacion([]);
    setCombinaciones([]);
    setModoNuevo(nuevoModo);
    if (nuevoModo !== "simple") setForm((actual) => ({ ...actual, controla_stock: true }));
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
        {!producto && <section className="sm:col-span-2 rounded-2xl border border-zinc-700 bg-black/30 p-4 sm:p-5">
          <h3 className="font-black text-white">¿Cómo manejas este producto?</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">Elige una sola opción. Esto organiza el stock sin cambiar la cantidad total.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { id: "simple" as const, titulo: "Sin opciones", detalle: "Un solo stock para todo el producto" },
              { id: "colores" as const, titulo: "Varios colores", detalle: "Configura tonos y cantidades ahora" },
              { id: "tallas" as const, titulo: "Solo tallas", detalle: "Define tallas y unidades desde aquí" },
              { id: "color_tallas" as const, titulo: "Color + tallas", detalle: "Combina cada color con sus tallas y existencias" },
            ].map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={modoNuevo === opcion.id}
                onClick={() => cambiarModo(opcion.id)}
                className={`min-h-24 rounded-xl border p-4 text-left transition ${modoNuevo === opcion.id ? "border-lime-400 bg-lime-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"}`}
              >
                <strong className="block text-sm text-white">{opcion.titulo}</strong>
                <span className="mt-2 block text-xs leading-5 text-zinc-500">{opcion.detalle}</span>
              </button>
            ))}
          </div>
        </section>}
        {(!tendraOpciones || producto) && <label className="text-sm text-zinc-400">{tieneVariantes ? "Stock sin clasificar" : "Stock base"}
          <input required min="0" step="1" type="number" disabled={!form.controla_stock || tieneVariantes} className={`${campo} disabled:cursor-not-allowed disabled:opacity-60`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          {tieneVariantes && <span className="mt-2 block text-xs leading-5 text-amber-200">Estas unidades todavía no están asignadas a una opción. Distribúyelas por color, talla o combinación en la sección de abajo; el total no cambia.</span>}
        </label>}
        {!producto && tieneColores && (
          <ColorStockFields skuBase={form.sku} colores={colores} onChange={setColores} />
        )}
        {!producto && (tieneTallas || tieneColorTallas) && (
          <CombinacionesStockFields
            skuBase={form.sku}
            conColores={tieneColorTallas}
            colores={coloresCombinacion}
            combinaciones={combinaciones}
            onColoresChange={setColoresCombinacion}
            onChange={setCombinaciones}
          />
        )}
        {form.venta_mayorista && <>
          <label className="text-sm text-zinc-400">Precio mayorista por unidad
            <input required min="0" step="1" type="number" className={campo} value={form.precio_mayorista} onChange={(e) => setForm({ ...form, precio_mayorista: e.target.value })} placeholder="Ej: 11900" />
          </label>
          <label className="text-sm text-zinc-400">Cantidad mínima mayorista
            <input required min="2" step="1" type="number" className={campo} value={form.cantidad_minima_mayorista} onChange={(e) => setForm({ ...form, cantidad_minima_mayorista: e.target.value })} placeholder="Ej: 6" />
          </label>
        </>}
        <section className="sm:col-span-2 rounded-2xl border border-sky-400/20 bg-sky-400/[0.035] p-4 sm:p-5">
          <label className="text-sm font-bold text-white">Descripción para el cliente
            <textarea required rows={5} className={`${campo} resize-y font-normal`} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Camiseta liviana en algodón, ideal para uso diario. Incluye cuello redondo y acabado suave." />
          </label>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-zinc-400 sm:grid-cols-2">
            <p className="rounded-xl border border-zinc-800 bg-black/30 p-3"><strong className="text-sky-200">Escribe aquí:</strong> qué es, para qué sirve, material, medidas y compatibilidad.</p>
            <p className="rounded-xl border border-zinc-800 bg-black/30 p-3"><strong className="text-amber-200">No pongas aquí:</strong> stock, precio, color ni talla. Esos datos se manejan en sus campos.</p>
          </div>
          <p className="mt-3 text-right text-[11px] text-zinc-500">{form.descripcion.trim().length} caracteres</p>
        </section>
        <ImageUploader
          value={form.imagen_url}
          onChange={(imagen_url) => setForm({ ...form, imagen_url })}
        />
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4 sm:grid-cols-2">
        <label className={`flex items-center gap-3 text-sm ${tendraOpciones || tieneVariantes ? "cursor-not-allowed text-zinc-500" : "cursor-pointer"}`}><input type="checkbox" disabled={tendraOpciones || tieneVariantes} checked={tendraOpciones || tieneVariantes || form.controla_stock} onChange={(e) => setForm({ ...form, controla_stock: e.target.checked })} /> {tendraOpciones || tieneVariantes ? "Controlar existencias por opción" : "Controlar existencias"}</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} /> Mostrar como destacado</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.en_oferta} onChange={(e) => setForm({ ...form, en_oferta: e.target.checked })} /> Marcar como oferta</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Mostrar producto en la tienda</label>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={form.venta_mayorista} onChange={(e) => setForm({ ...form, venta_mayorista: e.target.checked, precio_mayorista: e.target.checked ? form.precio_mayorista : "", cantidad_minima_mayorista: e.target.checked ? form.cantidad_minima_mayorista : "" })} /> Ofrecer precio mayorista</label>
      </div>

      {!form.activo && <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">El producto quedará suspendido: conservará sus datos, pero no aparecerá ni podrá comprarse.</p>}
      {mensaje && <p className={`mt-4 text-sm ${esError ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p>}
      <button disabled={guardando} className="mt-6 cursor-pointer rounded-xl bg-lime-400 px-6 py-3 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">
        {guardando
          ? "Guardando..."
          : producto
            ? "Guardar cambios"
            : tieneColores
              ? "Crear producto con colores"
              : tieneTallas
                ? "Crear producto con tallas"
                : tieneColorTallas
                  ? "Crear producto con colores y tallas"
                  : "Crear producto"}
      </button>
    </form>
  );
}
