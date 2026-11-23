"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "../ImageUploader";

type Variante = {
  id: string;
  nombre: string;
  color: string | null;
  talla: string | null;
  sku: string;
  precio: number | null;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  orden: number;
};

type Producto = {
  id: string;
  nombre: string;
  sku: string | null;
  precio: number;
  precio_mayorista: number | null;
  cantidad_minima_mayorista: number | null;
  venta_mayorista: boolean;
  controla_stock: boolean;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
};

type TipoOpcion = "color" | "talla" | "color_talla" | "otra";

const vacio = {
  nombre: "",
  color: "",
  talla: "",
  sku: "",
  precio: "",
  precio_mayorista: "",
  cantidad_minima_mayorista: "",
  stock: "0",
  imagen_url: "",
  activo: true,
};

const PALETA = ["#111111", "#ffffff", "#22c55e", "#ef4444", "#3b82f6", "#facc15", "#f97316", "#ec4899", "#a855f7", "#71717a", "#92400e", "#d6c7a1"];
const TALLAS_RAPIDAS = ["XS", "S", "M", "L", "XL", "XXL", "Única"];
const COLORES_NOMBRE: Record<string, string> = {
  negro: "#111111", blanco: "#ffffff", verde: "#22c55e", rojo: "#ef4444",
  azul: "#3b82f6", amarillo: "#facc15", naranja: "#f97316", rosado: "#ec4899",
  rosa: "#ec4899", morado: "#a855f7", gris: "#71717a", cafe: "#92400e", beige: "#d6c7a1",
};

const TIPOS: Array<{ id: TipoOpcion; titulo: string; detalle: string }> = [
  { id: "color", titulo: "Solo color", detalle: "Ej. Negro, blanco o rojo" },
  { id: "talla", titulo: "Solo talla", detalle: "Ej. S, M, L o 38" },
  { id: "color_talla", titulo: "Color + talla", detalle: "Ej. Negro en talla M" },
  { id: "otra", titulo: "Otra opción", detalle: "Ej. 500 ml o paquete x 3" },
];

function colorHex(valor: string) {
  if (/^#[0-9a-f]{6}$/i.test(valor)) return valor;
  return COLORES_NOMBRE[valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()] ?? "#82f000";
}

function tipoDeVariante(variante: Variante): TipoOpcion {
  if (variante.color && variante.talla) return "color_talla";
  if (variante.color) return "color";
  if (variante.talla) return "talla";
  return "otra";
}

function codigo(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 12);
}

function etiquetaOpcion(nombre: string, talla: string | null) {
  const nombreLimpio = nombre.trim();
  const tallaLimpia = talla?.trim() ?? "";
  if (!tallaLimpia) return nombreLimpio;
  const nombreNormalizado = nombreLimpio.toLocaleLowerCase("es");
  const tallaNormalizada = tallaLimpia.toLocaleLowerCase("es");
  if (nombreNormalizado === tallaNormalizada || nombreNormalizado.includes(`talla ${tallaNormalizada}`)) return nombreLimpio;
  return `${nombreLimpio} · Talla ${tallaLimpia}`;
}

export default function VariantesManager({ producto, iniciales }: { producto: Producto; iniciales: Variante[] }) {
  const router = useRouter();
  const [variantes, setVariantes] = useState(iniciales);
  const [stockSinAsignar, setStockSinAsignar] = useState(Number(producto.stock));
  const [editando, setEditando] = useState<string | null>(null);
  const [tipoOpcion, setTipoOpcion] = useState<TipoOpcion>("color");
  const [skuAutomatico, setSkuAutomatico] = useState(true);
  const [form, setForm] = useState(vacio);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function editar(variante: Variante) {
    setEditando(variante.id);
    setTipoOpcion(tipoDeVariante(variante));
    setSkuAutomatico(false);
    setForm({
      nombre: variante.nombre,
      color: variante.color ?? "",
      talla: variante.talla ?? "",
      sku: variante.sku,
      precio: variante.precio?.toString() ?? "",
      precio_mayorista: variante.precio_mayorista?.toString() ?? "",
      cantidad_minima_mayorista: variante.cantidad_minima_mayorista?.toString() ?? "",
      stock: String(variante.stock),
      imagen_url: variante.imagen_url ?? "",
      activo: variante.activo,
    });
    setMensaje("");
    setEsError(false);
  }

  function cancelar() {
    setEditando(null);
    setTipoOpcion("color");
    setSkuAutomatico(true);
    setForm(vacio);
    setMensaje("");
    setEsError(false);
  }

  function cambiarTipo(tipo: TipoOpcion) {
    setTipoOpcion(tipo);
    setForm((actual) => ({
      ...actual,
      nombre: tipo !== "talla" && /^Talla\s+/i.test(actual.nombre) ? "" : actual.nombre,
      color: tipo === "color" || tipo === "color_talla" ? actual.color : "",
      talla: tipo === "talla" || tipo === "color_talla" ? actual.talla : "",
      sku: skuAutomatico && tipo !== "talla" ? "" : actual.sku,
    }));
  }

  function seleccionarTalla(talla: string) {
    setForm((actual) => {
      const nombreAutomatico = tipoOpcion === "talla" && (!actual.nombre || /^Talla\s+/i.test(actual.nombre));
      return {
        ...actual,
        talla,
        nombre: nombreAutomatico ? `Talla ${talla}` : actual.nombre,
        sku: skuAutomatico && tipoOpcion === "talla"
          ? [codigo(producto.sku ?? producto.nombre), codigo(talla)].filter(Boolean).join("-")
          : actual.sku,
      };
    });
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setEsError(false);
    const necesitaColor = tipoOpcion === "color" || tipoOpcion === "color_talla";
    const necesitaTalla = tipoOpcion === "talla" || tipoOpcion === "color_talla";
    if ((necesitaColor && !form.color) || (necesitaTalla && !form.talla.trim())) {
      setGuardando(false);
      setEsError(true);
      setMensaje(necesitaColor && necesitaTalla ? "Elige el color y escribe la talla." : necesitaColor ? "Elige un color." : "Escribe la talla o el tamaño.");
      return;
    }
    const stockSolicitado = Number(form.stock);
    const stockActual = editando ? Number(variantes.find((item) => item.id === editando)?.stock ?? 0) : 0;
    if (!Number.isInteger(stockSolicitado) || stockSolicitado < 0 || stockSolicitado > stockSinAsignar + stockActual) {
      setGuardando(false);
      setEsError(true);
      setMensaje(`Solo puedes asignar hasta ${stockSinAsignar + stockActual} unidades a esta opción.`);
      return;
    }
    const url = editando ? `/api/admin/variantes/${editando}` : "/api/admin/variantes";
    const respuesta = await fetch(url, {
      method: editando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, productoId: producto.id }),
    }).catch(() => null);
    if (!respuesta) {
      setGuardando(false);
      setEsError(true);
      setMensaje("No fue posible comunicarse con la tienda. Inténtalo nuevamente.");
      return;
    }
    const data = await respuesta.json().catch(() => ({}));
    setGuardando(false);
    if (!respuesta.ok) {
      setEsError(true);
      setMensaje(data.error ?? "No fue posible guardar.");
      return;
    }
    setVariantes((actual) => editando
      ? actual.map((item) => item.id === editando ? data.variante : item)
      : [...actual, data.variante]);
    if (Number.isInteger(data.stock_base)) setStockSinAsignar(Number(data.stock_base));
    setEditando(null);
    setSkuAutomatico(true);
    setForm(vacio);
    setEsError(false);
    setMensaje(data.advertencia ?? "Opción guardada sin cambiar el total del inventario.");
    router.refresh();
  }

  async function eliminar(id: string) {
    const variante = variantes.find((item) => item.id === id);
    if (variante && Number(variante.stock) > 0) {
      setEsError(true);
      setMensaje("Primero edita esta opción y deja su stock en 0. Esas unidades regresarán al stock sin clasificar.");
      return;
    }
    if (!window.confirm("¿Eliminar esta opción? Los pedidos anteriores conservarán su información.")) return;
    const respuesta = await fetch(`/api/admin/variantes/${id}`, { method: "DELETE" });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      setEsError(true);
      setMensaje(data.error ?? "No fue posible eliminar.");
      return;
    }
    setVariantes((actual) => actual.filter((item) => item.id !== id));
    setEsError(false);
    setMensaje("Opción eliminada sin perder unidades.");
    router.refresh();
  }

  const varianteEditada = editando ? variantes.find((item) => item.id === editando) : null;
  const stockActualEditado = Number(varianteEditada?.stock ?? 0);
  const stockSolicitado = Number(form.stock) || 0;
  const stockSinAsignarDespues = stockSinAsignar - (stockSolicitado - stockActualEditado);
  const stockAsignado = variantes.reduce((total, variante) => total + (variante.controla_stock ? Number(variante.stock) : 0), 0);
  const variantesActivas = variantes.filter((variante) => variante.activo);
  const stockDisponible = producto.activo
    ? (variantesActivas.length > 0 ? variantesActivas.reduce((total, variante) => total + (variante.controla_stock ? Number(variante.stock) : 0), 0) : stockSinAsignar)
    : 0;
  const stockFisico = stockSinAsignar + stockAsignado;
  const stockMaximo = stockSinAsignar + stockActualEditado;
  const necesitaColor = tipoOpcion === "color" || tipoOpcion === "color_talla";
  const necesitaTalla = tipoOpcion === "talla" || tipoOpcion === "color_talla";
  const vistaPrevia = etiquetaOpcion(form.nombre.trim() || "Nombre de la opción", form.talla);
  const campo = "w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

  return (
    <div className="mt-7">
      <section className="mb-6 rounded-2xl border border-lime-400/25 bg-lime-400/[0.05] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">DISTRIBUCIÓN DEL INVENTARIO</p>
            <h2 className="mt-2 text-xl font-black">Reparte el stock por color, talla u opción</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Cada opción representa una combinación exacta que el cliente puede elegir. El total físico nunca cambia.</p>
          </div>
          <span className="rounded-full bg-lime-400 px-3 py-1 text-sm font-black text-black">TOTAL {stockFisico}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Sin clasificar</p><p className="mt-1 text-2xl font-black text-amber-300">{stockSinAsignar}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Asignadas a opciones</p><p className="mt-1 text-2xl font-black">{stockAsignado}</p></div>
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4"><p className="text-xs text-zinc-500">Disponibles en la tienda</p><p className="mt-1 text-2xl font-black text-lime-300">{stockDisponible}</p></div>
        </div>
        {stockSinAsignar > 0 && variantes.length > 0 ? <p className="mt-3 text-sm text-amber-200">Quedan {stockSinAsignar} unidades sin clasificar. Asígnalas a una opción para venderlas por color o talla.</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={guardar} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <h2 className="text-xl font-black">{editando ? "Editar opción del producto" : "Agregar opción del producto"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Primero indica qué vas a manejar. Después completa solo los campos necesarios.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {TIPOS.map((tipo) => (
              <button key={tipo.id} type="button" aria-pressed={tipoOpcion === tipo.id} onClick={() => cambiarTipo(tipo.id)} className={`min-h-16 rounded-xl border p-3 text-left transition ${tipoOpcion === tipo.id ? "border-lime-400 bg-lime-400/10" : "border-zinc-700 bg-black/30 hover:border-zinc-500"}`}>
                <strong className="block text-sm text-white">{tipo.titulo}</strong>
                <span className="mt-1 block text-[11px] leading-4 text-zinc-500">{tipo.detalle}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-zinc-700 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-400">Así lo verá el cliente</p>
            <p className="mt-2 font-black text-white">{vistaPrevia}</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm text-zinc-400">
              {tipoOpcion === "color" ? "Nombre del color" : tipoOpcion === "talla" ? "Nombre de la talla" : "Nombre que verá el cliente"}
              <input required maxLength={50} className={`${campo} mt-2`} placeholder={tipoOpcion === "talla" ? "Ej: Talla M" : tipoOpcion === "color_talla" ? "Ej: Negro" : tipoOpcion === "otra" ? "Ej: Paquete x 3" : "Ej: Negro"} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
              <span className="mt-2 block text-xs leading-5 text-zinc-500">Este texto aparece junto al selector en la tienda.</span>
            </label>

            {necesitaColor ? (
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-400">Color</p>
                <div className="mt-2 rounded-xl border border-zinc-700 bg-black p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {PALETA.map((tono) => <button key={tono} type="button" aria-label={`Elegir color ${tono}`} title={tono} onClick={() => setForm({ ...form, color: tono })} className={`h-10 w-10 rounded-full border-2 p-1 transition hover:scale-105 ${form.color && colorHex(form.color) === tono ? "border-lime-400 shadow-[0_0_0_3px_rgba(163,230,53,0.18)]" : "border-zinc-600"}`}><span className="block h-full w-full rounded-full border border-black/20" style={{ backgroundColor: tono }} /></button>)}
                    <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-lime-400"><input type="color" value={colorHex(form.color)} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" /> Otro tono</label>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">El círculo que elijas será el tono que verá el cliente.</p>
                </div>
              </div>
            ) : null}

            {necesitaTalla ? (
              <label className="sm:col-span-2 text-sm text-zinc-400">
                Talla o tamaño
                <div className="mt-2 flex flex-wrap gap-2">{TALLAS_RAPIDAS.map((talla) => <button key={talla} type="button" onClick={() => seleccionarTalla(talla)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-black ${form.talla === talla ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-zinc-700 text-zinc-300"}`}>{talla}</button>)}</div>
                <input required maxLength={30} className={`${campo} mt-2`} placeholder="Ej: M, 38, 10 cm o Única" value={form.talla} onChange={(event) => seleccionarTalla(event.target.value)} />
              </label>
            ) : null}

            <label className="text-sm text-zinc-400">SKU único
              <input required className={`${campo} mt-2`} placeholder="CAM-NEG-M" value={form.sku} onChange={(event) => { setSkuAutomatico(false); setForm({ ...form, sku: event.target.value.toUpperCase() }); }} />
              <span className="mt-2 block text-xs leading-5 text-zinc-500">Cada combinación debe tener un SKU diferente.</span>
            </label>
            <label className="text-sm text-zinc-400">Cantidad de esta opción
              <input required min="0" max={stockMaximo} type="number" className={`${campo} mt-2`} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
              <span className="mt-2 block text-xs leading-5 text-zinc-500">Puedes asignar hasta {stockMaximo}. Quedarán <strong className={stockSinAsignarDespues < 0 ? "text-red-300" : "text-amber-300"}>{Math.max(stockSinAsignarDespues, 0)} sin clasificar</strong>.</span>
            </label>
            <label className="text-sm text-zinc-400">Precio especial (opcional)<input min="0" type="number" className={`${campo} mt-2`} placeholder={`Usar precio base: ${producto.precio}`} value={form.precio} onChange={(event) => setForm({ ...form, precio: event.target.value })} /></label>
            {producto.venta_mayorista ? <>
              <label className="text-sm text-zinc-400">Precio mayorista propio (opcional)<input min="0" type="number" className={`${campo} mt-2`} placeholder={producto.precio_mayorista ? `Base: ${producto.precio_mayorista}` : "Usar precio del producto"} value={form.precio_mayorista} onChange={(event) => setForm({ ...form, precio_mayorista: event.target.value })} /></label>
              <label className="text-sm text-zinc-400">Mínimo mayorista propio (opcional)<input min="2" type="number" className={`${campo} mt-2`} placeholder={producto.cantidad_minima_mayorista ? `Base: ${producto.cantidad_minima_mayorista}` : "Usar mínimo del producto"} value={form.cantidad_minima_mayorista} onChange={(event) => setForm({ ...form, cantidad_minima_mayorista: event.target.value })} /></label>
            </> : null}
            <ImageUploader label="Fotografía de esta opción (opcional)" value={form.imagen_url} onChange={(imagen_url) => setForm({ ...form, imagen_url })} />
            <label className="sm:col-span-2 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.activo} onChange={(event) => setForm({ ...form, activo: event.target.checked })} /> Mostrar esta opción en la tienda</label>
          </div>

          {mensaje ? <p className={`mt-4 text-sm ${esError ? "text-red-300" : "text-lime-300"}`}>{mensaje}</p> : null}
          <div className="mt-5 grid gap-3 min-[400px]:flex min-[400px]:flex-wrap">
            <button disabled={guardando} className="min-h-12 rounded-xl bg-lime-400 px-5 py-3 font-black text-black disabled:opacity-50">{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar opción"}</button>
            {editando ? <button type="button" onClick={cancelar} className="min-h-12 rounded-xl border border-zinc-700 px-5 py-3 font-bold">Cancelar</button> : null}
          </div>
        </form>

        <section className="min-w-0 space-y-3">
          <h2 className="break-words text-xl font-black">Opciones creadas ({variantes.length})</h2>
          {variantes.length === 0 ? <p className="rounded-2xl border border-zinc-800 p-6 text-zinc-400">Este producto todavía no tiene colores, tallas ni otras opciones.</p> : variantes.map((variante) => (
            <article key={variante.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex flex-col gap-4 min-[460px]:flex-row min-[460px]:justify-between">
                <div className="flex min-w-0 gap-3">
                  {variante.color ? <span className="mt-0.5 h-9 w-9 shrink-0 rounded-full border-2 border-zinc-600 p-1"><span className="block h-full w-full rounded-full border border-black/20" style={{ backgroundColor: colorHex(variante.color) }} /></span> : <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-black text-xs font-black text-lime-300">{variante.talla ? "T" : "OP"}</span>}
                  <div className="min-w-0">
                    <h3 className="break-words font-black">{etiquetaOpcion(variante.nombre, variante.talla)}</h3>
                    <p className={`mt-1 break-words text-xs font-semibold ${variante.stock <= 0 ? "text-red-300" : "text-zinc-500"}`}>SKU {variante.sku} · {variante.stock <= 0 ? "Agotado · No seleccionable en la tienda" : `Stock ${variante.stock}`} · {variante.activo ? "Visible" : "Oculta"}</p>
                    <p className="mt-2 text-sm text-zinc-300">{variante.precio !== null ? `$${variante.precio.toLocaleString("es-CO")}` : "Usa el precio base"}</p>
                    {producto.venta_mayorista ? <p className="mt-1 break-words text-xs text-lime-300">Mayorista: ${Number(variante.precio_mayorista ?? producto.precio_mayorista).toLocaleString("es-CO")} desde {variante.cantidad_minima_mayorista ?? producto.cantidad_minima_mayorista} unidades</p> : null}
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 min-[460px]:flex"><button onClick={() => editar(variante)} className="min-h-11 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400">Editar</button><button onClick={() => eliminar(variante.id)} className="min-h-11 rounded-lg border border-red-900 px-3 py-2 text-xs font-bold text-red-300">Eliminar</button></div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
