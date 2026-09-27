import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { slugCategoria } from "@/app/lib/categoriasProducto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const icono = typeof body?.icono === "string" ? body.icono.trim() : "📦";
  const orden = Number(body?.orden);
  const slug = slugCategoria(nombre);
  if (!nombre || !slug || !descripcion || !icono || !Number.isInteger(orden) || orden < 0) return NextResponse.json({ error: "Completa correctamente todos los campos." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("categorias_producto").insert({ nombre, slug, descripcion, icono, orden, activo: true }).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Ya existe una categoría con ese nombre." : "No fue posible crear la categoría." }, { status: 409 });
  return NextResponse.json({ ok: true, categoria: data }, { status: 201 });
}

