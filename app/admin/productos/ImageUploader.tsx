"use client";

import { ChangeEvent, useRef, useState } from "react";

export default function ImageUploader({
  value,
  onChange,
  label = "Fotografía del producto",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function seleccionar(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;
    if (archivo.size > 4 * 1024 * 1024) {
      setError("La fotografía debe pesar máximo 4 MB.");
      return;
    }

    setSubiendo(true);
    setError("");
    const datos = new FormData();
    datos.append("imagen", archivo);
    const respuesta = await fetch("/api/admin/imagenes", { method: "POST", body: datos });
    const resultado = await respuesta.json().catch(() => ({}));
    setSubiendo(false);
    if (!respuesta.ok) {
      setError(resultado.error ?? "No fue posible subir la fotografía.");
      return;
    }
    onChange(resultado.url);
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="mt-2 flex flex-col gap-4 rounded-xl border border-zinc-700 bg-black/40 p-4 sm:flex-row sm:items-center">
        <div
          className="h-36 w-full shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 bg-contain bg-center bg-no-repeat sm:w-36"
          style={value ? { backgroundImage: `url(${JSON.stringify(value)})` } : undefined}
        >
          {!value && <div className="flex h-full items-center justify-center text-4xl text-zinc-600">📷</div>}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={seleccionar}
          />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-lime-400 px-5 py-3 font-black text-black transition hover:bg-lime-300 disabled:opacity-50"
          >
            {subiendo ? "Subiendo fotografía..." : value ? "Cambiar fotografía" : "Elegir fotografía"}
          </button>
          {value && (
            <button
              type="button"
              disabled={subiendo}
              onClick={() => onChange("")}
              className="ml-3 rounded-xl border border-zinc-700 px-4 py-3 font-bold text-zinc-300"
            >
              Quitar
            </button>
          )}
          <p className="mt-3 text-xs text-zinc-500">JPG, PNG o WEBP · máximo 4 MB. La tienda la optimiza automáticamente.</p>
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
