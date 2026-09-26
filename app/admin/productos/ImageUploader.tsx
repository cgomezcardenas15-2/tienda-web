"use client";

import { ChangeEvent, useRef, useState } from "react";

const MAX_ORIGINAL_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

async function optimizarImagen(archivo: File) {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, MAX_IMAGE_SIDE / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(imagen.width * escala));
  canvas.height = Math.max(1, Math.round(imagen.height * escala));

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    imagen.close();
    throw new Error("No fue posible preparar la fotografía.");
  }
  contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  imagen.close();

  const resultado = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });
  if (!resultado) throw new Error("No fue posible optimizar la fotografía.");

  return new File([resultado], "producto.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

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
    if (archivo.size > MAX_ORIGINAL_SIZE) {
      setError("La fotografía original debe pesar máximo 8 MB.");
      return;
    }

    setSubiendo(true);
    setError("");
    try {
      const imagenOptimizada = await optimizarImagen(archivo);
      const datos = new FormData();
      datos.append("imagen", imagenOptimizada);
      const respuesta = await fetch("/api/admin/imagenes", { method: "POST", body: datos });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(resultado.error ?? `No fue posible subir la fotografía (error ${respuesta.status}).`);
        return;
      }
      onChange(resultado.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No fue posible subir la fotografía.");
    } finally {
      setSubiendo(false);
    }
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
          <p className="mt-3 text-xs text-zinc-500">JPG, PNG o WEBP · máximo 8 MB. La tienda la optimiza automáticamente.</p>
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
