"use client";

import { useState } from "react";
import {
  CombinacionStockNueva,
  crearSkuColorTalla,
  crearSkuTalla,
  PALETA_COLORES_PRODUCTO,
} from "@/app/lib/coloresProducto";

export type ColorCombinacionNuevo = {
  id: string;
  nombre: string;
  color: string;
};

const TALLAS_RAPIDAS = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

function nuevoId(prefijo: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

export default function CombinacionesStockFields({
  skuBase,
  conColores,
  colores,
  combinaciones,
  onColoresChange,
  onChange,
}: {
  skuBase: string;
  conColores: boolean;
  colores: ColorCombinacionNuevo[];
  combinaciones: CombinacionStockNueva[];
  onColoresChange: (colores: ColorCombinacionNuevo[]) => void;
  onChange: (combinaciones: CombinacionStockNueva[]) => void;
}) {
  const [colorPersonalizado, setColorPersonalizado] = useState("#82f000");
  const [tallasPersonalizadas, setTallasPersonalizadas] = useState<Record<string, string>>({});
  const total = combinaciones.reduce((suma, item) => suma + (Number(item.stock) || 0), 0);
  const limiteAlcanzado = combinaciones.length >= 100;
  const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

  function combinacionesDe(colorId: string) {
    return combinaciones.filter((item) => item.colorId === colorId);
  }

  function agregarTalla(color: ColorCombinacionNuevo | null, valor: string) {
    const talla = valor.trim();
    const colorId = color?.id ?? "sin-color";
    if (!talla || limiteAlcanzado) return;
    if (combinacionesDe(colorId).some((item) => normalizar(item.talla) === normalizar(talla))) return;
    onChange([
      ...combinaciones,
      {
        id: nuevoId("talla"),
        colorId,
        nombre: color?.nombre ?? `Talla ${talla}`,
        color: color?.color ?? null,
        talla,
        stock: "0",
      },
    ]);
    setTallasPersonalizadas((actual) => ({ ...actual, [colorId]: "" }));
  }

  function quitarTalla(id: string) {
    const opcion = combinaciones.find((item) => item.id === id);
    if (opcion && Number(opcion.stock) > 0 && !window.confirm(`¿Quitar la talla ${opcion.talla} y sus ${opcion.stock} unidades?`)) return;
    onChange(combinaciones.filter((item) => item.id !== id));
  }

  function alternarTalla(color: ColorCombinacionNuevo | null, talla: string) {
    const colorId = color?.id ?? "sin-color";
    const existente = combinacionesDe(colorId).find((item) => normalizar(item.talla) === normalizar(talla));
    if (existente) quitarTalla(existente.id);
    else agregarTalla(color, talla);
  }

  function actualizarCombinacion(id: string, cambios: Partial<CombinacionStockNueva>) {
    onChange(combinaciones.map((item) => item.id === id ? { ...item, ...cambios } : item));
  }

  function agregarColor(nombre: string, color: string) {
    if (colores.some((item) => item.color.toLowerCase() === color.toLowerCase())) return;
    onColoresChange([...colores, { id: nuevoId("color"), nombre, color }]);
  }

  function quitarColor(id: string) {
    const tieneExistenciasConfiguradas = combinaciones.some((item) => item.colorId === id);
    if (tieneExistenciasConfiguradas && !window.confirm("¿Quitar este color y todas sus tallas configuradas?")) return;
    onColoresChange(colores.filter((item) => item.id !== id));
    onChange(combinaciones.filter((item) => item.colorId !== id));
  }

  function actualizarColor(id: string, cambios: Partial<ColorCombinacionNuevo>) {
    const siguiente = colores.map((item) => item.id === id ? { ...item, ...cambios } : item);
    const colorActualizado = siguiente.find((item) => item.id === id);
    onColoresChange(siguiente);
    if (colorActualizado) {
      onChange(combinaciones.map((item) => item.colorId === id ? {
        ...item,
        nombre: colorActualizado.nombre,
        color: colorActualizado.color,
      } : item));
    }
  }

  function renderTallas(color: ColorCombinacionNuevo | null) {
    const colorId = color?.id ?? "sin-color";
    const opciones = combinacionesDe(colorId);
    return (
      <div className="mt-4">
        <p className="text-sm font-black text-white">
          {conColores ? "Tallas disponibles en este color" : "Tallas disponibles"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TALLAS_RAPIDAS.map((talla) => {
            const seleccionada = opciones.some((item) => normalizar(item.talla) === normalizar(talla));
            return (
              <button
                key={talla}
                type="button"
                aria-pressed={seleccionada}
                disabled={!seleccionada && limiteAlcanzado}
                onClick={() => alternarTalla(color, talla)}
                className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-black transition ${
                  seleccionada
                    ? "border-lime-400 bg-lime-400/10 text-lime-300"
                    : "border-zinc-700 text-zinc-300 hover:border-lime-400 disabled:cursor-not-allowed disabled:opacity-40"
                }`}
              >
                {seleccionada ? "✓ " : "+ "}{talla}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            maxLength={30}
            className={`${campo} mt-0`}
            placeholder="Otra talla: 38, 10 cm..."
            value={tallasPersonalizadas[colorId] ?? ""}
            onChange={(event) => setTallasPersonalizadas((actual) => ({ ...actual, [colorId]: event.target.value }))}
          />
          <button
            type="button"
            disabled={limiteAlcanzado || !(tallasPersonalizadas[colorId] ?? "").trim()}
            onClick={() => agregarTalla(color, tallasPersonalizadas[colorId] ?? "")}
            className="min-h-12 shrink-0 rounded-xl border border-lime-400 px-4 font-black text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agregar talla
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {opciones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
              Selecciona al menos una talla y escribe sus unidades.
            </p>
          ) : opciones.map((item) => {
            const sku = color && item.color
              ? crearSkuColorTalla(skuBase, item.nombre, item.color, item.talla)
              : crearSkuTalla(skuBase, item.talla);
            return (
              <div key={item.id} className="grid gap-3 rounded-xl border border-zinc-700 bg-black/40 p-4 sm:grid-cols-[1fr_0.8fr_1.4fr_auto] sm:items-end">
                <label className="text-xs text-zinc-400">Talla
                  <input
                    required
                    maxLength={30}
                    className={`${campo} mt-1`}
                    value={item.talla}
                    onChange={(event) => actualizarCombinacion(item.id, {
                      talla: event.target.value,
                      nombre: color ? item.nombre : `Talla ${event.target.value}`,
                    })}
                  />
                </label>
                <label className="text-xs text-zinc-400">Unidades
                  <input
                    required
                    min="0"
                    step="1"
                    type="number"
                    inputMode="numeric"
                    className={`${campo} mt-1`}
                    value={item.stock}
                    onChange={(event) => actualizarCombinacion(item.id, { stock: event.target.value })}
                  />
                </label>
                <div className="min-w-0 text-xs text-zinc-400">
                  SKU automático
                  <p className="mt-1 break-all rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-[11px] text-zinc-300">
                    {sku || "Completa el SKU principal y la talla"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => quitarTalla(item.id)}
                  className="min-h-11 rounded-xl border border-red-900 px-3 text-xs font-bold text-red-300"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="sm:col-span-2 rounded-2xl border border-lime-400/25 bg-lime-400/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-white">{conColores ? "Colores, tallas y existencias" : "Tallas y existencias"}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {conColores
              ? "Elige cada color y luego marca las tallas disponibles con su cantidad."
              : "Marca las tallas disponibles y escribe cuántas unidades tienes de cada una."}
          </p>
        </div>
        <span className="rounded-full bg-lime-400/15 px-3 py-1 text-xs font-black text-lime-300">
          Total: {total} unidades
        </span>
      </div>

      {conColores ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 min-[520px]:grid-cols-3 sm:grid-cols-4" role="group" aria-label="Paleta de colores para combinar con tallas">
            {PALETA_COLORES_PRODUCTO.map((opcion) => {
              const existente = colores.find((item) => item.color.toLowerCase() === opcion.color.toLowerCase());
              return (
                <button
                  key={opcion.color}
                  type="button"
                  aria-pressed={Boolean(existente)}
                  onClick={() => existente ? quitarColor(existente.id) : agregarColor(opcion.nombre, opcion.color)}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                    existente
                      ? "border-lime-400 bg-lime-400/10 text-lime-200"
                      : "border-zinc-700 bg-black/40 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span className="h-7 w-7 shrink-0 rounded-full border border-white/25" style={{ backgroundColor: opcion.color }} />
                  {opcion.nombre}{existente ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <input type="color" value={colorPersonalizado} onChange={(event) => setColorPersonalizado(event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
              Otro tono
            </label>
            <button type="button" onClick={() => agregarColor(`Color ${colorPersonalizado.slice(1).toUpperCase()}`, colorPersonalizado)} className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">
              Agregar tono
            </button>
          </div>

          {colores.length === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
              Elige al menos un color para configurar sus tallas.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {colores.map((color) => (
                <article key={color.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                    <label className="flex items-center gap-3 sm:block">
                      <span className="text-xs font-bold text-zinc-400 sm:block">Tono</span>
                      <input type="color" value={color.color} onChange={(event) => actualizarColor(color.id, { color: event.target.value })} className="h-11 w-14 cursor-pointer rounded border-0 bg-transparent sm:mt-2" />
                    </label>
                    <label className="text-sm text-zinc-400">Nombre del color
                      <input required maxLength={50} className={campo} value={color.nombre} onChange={(event) => actualizarColor(color.id, { nombre: event.target.value })} />
                    </label>
                    <button type="button" onClick={() => quitarColor(color.id)} className="min-h-11 rounded-xl border border-red-900 px-4 text-sm font-bold text-red-300">Quitar color</button>
                  </div>
                  {renderTallas(color)}
                </article>
              ))}
            </div>
          )}
        </>
      ) : renderTallas(null)}

      {limiteAlcanzado ? <p className="mt-4 text-xs font-semibold text-amber-300">Llegaste al máximo de 100 combinaciones por producto.</p> : null}
    </section>
  );
}
