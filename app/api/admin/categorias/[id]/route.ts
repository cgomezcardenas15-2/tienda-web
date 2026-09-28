import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const icono = typeof body?.icono === "string" ? body.icono.trim() : "";
  const orden = Number(body?.orden);
  if (!nombre || !descripcion || !icono || !Number.isInteger(orden) || orden < 0) return NextResponse.json({ error: "Completa correctamente todos los campos." }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("categorias_producto").update({ nombre, descripcion, icono, orden, activo: body?.activo === true, actualizado_en: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: "No fue posible guardar la categoría." }, { status: 409 });
  if (!data) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, categoria: data });
}
