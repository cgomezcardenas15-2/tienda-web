import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const BUCKET = "imagenes-productos";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const STORAGE_FILE_SIZE = 8 * 1024 * 1024;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function coincideFirmaImagen(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= png.length && png.every((value, index) => bytes[index] === value);
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

async function asegurarBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: STORAGE_FILE_SIZE,
      allowedMimeTypes: null,
    });
    return updateError;
  }
  if (error && !/not found/i.test(error.message)) return error;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: STORAGE_FILE_SIZE,
  });
  return createError;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!await getAdminSession()) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("imagen");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Selecciona una fotografía." }, { status: 400 });
  }
  if (!MIME_TYPES.has(archivo.type) || archivo.size <= 0 || archivo.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Usa una imagen JPG, PNG o WEBP de máximo 4 MB." },
      { status: 400 },
    );
  }

  const imagen = new Uint8Array(await archivo.arrayBuffer());
  if (!coincideFirmaImagen(imagen, archivo.type)) {
    return NextResponse.json(
      { error: "El archivo seleccionado no contiene una imagen válida." },
      { status: 400 },
    );
  }

  const errorBucket = await asegurarBucket();
  if (errorBucket) {
    console.error("No fue posible preparar el almacenamiento de imágenes", errorBucket.message);
    return NextResponse.json({ error: "No fue posible preparar el almacenamiento." }, { status: 500 });
  }

  const extension = archivo.type === "image/png" ? "png" : archivo.type === "image/jpeg" ? "jpg" : "webp";
  const ruta = `catalogo/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(ruta, imagen, {
    contentType: archivo.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("Error subiendo imagen de producto", error.message);
    const detalle = error.message.trim();
    return NextResponse.json(
      {
        error: detalle
          ? `No fue posible subir la fotografía: ${detalle}`
          : "No fue posible subir la fotografía.",
      },
      { status: 500 },
    );
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(ruta);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
