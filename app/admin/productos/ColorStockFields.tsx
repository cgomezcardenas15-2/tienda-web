"use client";

import { useState } from "react";
import {
  ColorStockNuevo,
  crearSkuColor,
  PALETA_COLORES_PRODUCTO,
} from "@/app/lib/coloresProducto";

function nuevoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `color-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ColorStockFields({
  skuBase,
  colores,
  onChange,
}: {
  skuBase: string;
  colores: ColorStockNuevo[];
  onChange: (colores: ColorStockNuevo[]) => void;
}) {
  const [colorPersonalizado, setColorPersonalizado] = useState("#82f000");

  function alternarColor(nombre: string, color: string) {
    const existente = colores.find(
      (item) => item.color.toLowerCase() === color.toLowerCase(),
    );
    if (existente) {
      onChange(colores.filter((item) => item.id !== existente.id));
      return;
    }
    onChange([...colores, { id: nuevoId(), nombre, color, stock: "0" }]);
  }

  function agregarPersonalizado() {
    if (colores.some((item) => item.color.toLowerCase() === colorPersonalizado.toLowerCase())) return;
    onChange([
      ...colores,
      {
        id: nuevoId(),
        nombre: `Color ${colorPersonalizado.replace("#", "").toUpperCase()}`,
        color: colorPersonalizado,
        stock: "0",
      },
    ]);
  }

  function actualizar(id: string, cambios: Partial<ColorStockNuevo>) {
    onChange(colores.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  const total = colores.reduce((suma, item) => suma + (Number(item.stock) || 0), 0);
  const personalizadoRepetido = colores.some(
    (item) => item.color.toLowerCase() === colorPersonalizado.toLowerCase(),
  );
  const limiteAlcanzado = colores.length >= 30;
  const campo = "mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-400";

  return (
    <section className="sm:col-span-2 rounded-2xl border border-lime-400/25 bg-lime-400/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-white">Colores y existencias</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Selecciona los colores disponibles y escribe cuántas unidades tienes de cada uno.
          </p>
        </div>
        <span aria-live="polite" className="rounded-full bg-lime-400/15 px-3 py-1 text-xs font-black text-lime-300">
          Total: {total} unidades
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 min-[520px]:grid-cols-3 sm:grid-cols-4" role="group" aria-label="Paleta de colores del producto">
        {PALETA_COLORES_PRODUCTO.map((opcion) => {
          const seleccionado = colores.some(
            (item) => item.color.toLowerCase() === opcion.color.toLowerCase(),
          );
          return (
            <button
              key={opcion.color}
              type="button"
              aria-pressed={seleccionado}
              aria-label={`${seleccionado ? "Quitar" : "Agregar"} color ${opcion.nombre}`}
              title={opcion.nombre}
              disabled={!seleccionado && limiteAlcanzado}
              onClick={() => alternarColor(opcion.nombre, opcion.color)}
              className={`flex min-h-12 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                seleccionado
                  ? "border-lime-400 bg-lime-400/10 text-lime-200"
                  : "border-zinc-700 bg-black/40 text-zinc-300 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              <span className="h-7 w-7 rounded-full border border-white/25" style={{ backgroundColor: opcion.color }} />
              {opcion.nombre}
              {seleccionado ? <span aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-black/30 p-3">
        <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
          <input
            type="color"
            value={colorPersonalizado}
            onChange={(event) => setColorPersonalizado(event.target.value)}
            className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent"
          />
          Otro tono
        </label>
        <button
          type="button"
          onClick={agregarPersonalizado}
          disabled={personalizadoRepetido || limiteAlcanzado}
          className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agregar tono
        </button>
        {personalizadoRepetido ? <span className="text-xs font-semibold text-amber-300">Ese tono ya está agregado.</span> : null}
        {limiteAlcanzado ? <span className="text-xs font-semibold text-amber-300">Llegaste al máximo de 30 colores.</span> : null}
      </div>

      {colores.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          Elige al menos un color para poder crear el producto con existencias por color.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {colores.map((item) => {
            const nombreNormalizado = item.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
            const nombreDuplicado = nombreNormalizado !== "" && colores.some((otro) => otro.id !== item.id && otro.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === nombreNormalizado);
            const tonoDuplicado = colores.some((otro) => otro.id !== item.id && otro.color.toLowerCase() === item.color.toLowerCase());
            return <article key={item.id} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-[auto_1fr_160px_auto] sm:items-end sm:p-4">
              <label className="flex items-center gap-3 sm:block">
                <span className="text-xs font-bold text-zinc-400 sm:block">Tono</span>
                <input
                  type="color"
                  value={item.color}
                  onChange={(event) => actualizar(item.id, { color: event.target.value })}
                  className="mt-0 h-11 w-14 cursor-pointer rounded border-0 bg-transparent sm:mt-2"
                  aria-label={`Tono de ${item.nombre}`}
                />
              </label>
              <label className="text-sm text-zinc-400">
                Nombre visible
                <input
                  required
                  maxLength={50}
                  aria-invalid={nombreDuplicado}
                  className={`${campo} ${nombreDuplicado ? "border-red-500" : ""}`}
                  value={item.nombre}
                  onChange={(event) => actualizar(item.id, { nombre: event.target.value })}
                  placeholder="Ej: Verde oscuro"
                />
                <span className="mt-1 block break-all text-[11px] text-zinc-500">
                  SKU: {crearSkuColor(skuBase, item.nombre, item.color) || "Completa el SKU principal"}
                </span>
                {nombreDuplicado ? <span className="mt-1 block text-[11px] font-semibold text-red-300">Ese nombre ya está usado.</span> : null}
              </label>
              <label className="text-sm text-zinc-400">
                Unidades disponibles
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  inputMode="numeric"
                  className={campo}
                  value={item.stock}
                  onChange={(event) => actualizar(item.id, { stock: event.target.value })}
                />
                {item.stock !== "" && Number(item.stock) === 0 ? (
                  <span className="mt-1 block text-[11px] font-semibold text-red-300">Aparecerá agotado y no se podrá elegir.</span>
                ) : null}
                {item.stock === "" ? <span className="mt-1 block text-[11px] font-semibold text-amber-300">Escribe la cantidad disponible.</span> : null}
              </label>
              <button
                type="button"
                aria-label={`Quitar color ${item.nombre}`}
                onClick={() => onChange(colores.filter((color) => color.id !== item.id))}
                className="min-h-11 rounded-xl border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
              >
                Quitar
              </button>
              {tonoDuplicado ? <p className="text-xs font-semibold text-red-300 sm:col-span-4">Ese tono ya está agregado. Cambia uno de los dos o quítalo.</p> : null}
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
