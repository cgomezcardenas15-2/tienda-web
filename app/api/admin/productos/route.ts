import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { esCategoriaActiva, normalizarCategoria } from "@/app/lib/categoriasActivas";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function enteroPesos(valor: unknown) {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return Number.NaN;

  const limpio = valor.trim().replace(/[$\s]/g, "").replace(/\./g, "");
  return limpio === "" ? Number.NaN : Number(limpio);
}

function slugProducto(nombre: string) {
  return normalizarCategoria(nombre).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function limpiarProducto(body: Record<string, unknown>) {
  const nombre = texto(body.nombre);
  const precioAnteriorTexto = texto(body.precio_anterior);
  const controlaStock = body.controla_stock !== false;
  return {
    nombre,
    slug: slugProducto(nombre),
    sku: texto(body.sku).toUpperCase(),
    descripcion: texto(body.descripcion),
    categoria: texto(body.categoria),
    precio: enteroPesos(body.precio),
    precio_anterior: precioAnteriorTexto === "" ? null : enteroPesos(body.precio_anterior),
    controla_stock: controlaStock,
    stock: controlaStock ? enteroPesos(body.stock) : 0,
    imagen_url: texto(body.imagen_url) || null,
    destacado: body.destacado === true,
    en_oferta: body.en_oferta === true,
    activo: body.activo !== false,
  };
}

export function errorValidacionProducto(datos: ReturnType<typeof limpiarProducto>) {
  if (!datos.nombre || !datos.slug || !datos.sku || !datos.descripcion) return "Completa nombre, SKU y descripción.";
  if (!esCategoriaActiva(datos.categoria)) return "Selecciona Piñatería, Hogar o Mascotas.";
  if (!Number.isInteger(datos.precio) || datos.precio < 0) return "El precio no es válido.";
  if (datos.precio_anterior !== null && (!Number.isInteger(datos.precio_anterior) || datos.precio_anterior <= datos.precio)) return "El precio anterior debe ser mayor al precio de venta.";
  if (!Number.isInteger(datos.stock) || datos.stock < 0) return "El stock no es válido.";
  return null;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiarProducto(body);
  const validacion = errorValidacionProducto(datos);
  if (validacion) return NextResponse.json({ error: validacion }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("productos").insert(datos).select("*").single();
  if (error) {
    console.error("Error creando producto:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.code === "23505" ? "Ya existe un producto con ese nombre o SKU." : "No fue posible crear el producto." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, producto: data }, { status: 201 });
}
