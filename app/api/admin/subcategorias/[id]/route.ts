import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!await getAdminSession()) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const orden = Number(body?.orden);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    || !nombre || nombre.length > 80 || descripcion.length > 180
    || !Number.isInteger(orden) || orden < 0) {
    return NextResponse.json({ error: "Completa correctamente el nombre y el orden." }, { status: 400 });
  }

  const { data: actual, error: errorActual } = await supabaseAdmin
    .from("subcategorias_producto")
    .select("id,categoria_id")
    .eq("id", id)
    .maybeSingle();

  if (errorActual) {
    return NextResponse.json({ error: "No fue posible verificar la subcategoría." }, { status: 500 });
  }
  if (!actual) {
    return NextResponse.json({ error: "Subcategoría no encontrada." }, { status: 404 });
  }

  const { data: duplicada, error: errorDuplicada } = await supabaseAdmin
    .from("subcategorias_producto")
    .select("id")
    .eq("categoria_id", actual.categoria_id)
    .ilike("nombre", nombre)
    .neq("id", id)
    .limit(1)
    .maybeSingle();

  if (errorDuplicada) {
    return NextResponse.json({ error: "No fue posible validar el nombre." }, { status: 500 });
  }
  if (duplicada) {
    return NextResponse.json({ error: "Ya existe una subcategoría con ese nombre." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("subcategorias_producto")
    .update({
      nombre,
      descripcion,
      orden,
      activo: body?.activo === true,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,categoria_id,nombre,slug,descripcion,activo,orden")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: error.code === "23505"
          ? "Ya existe una subcategoría con ese nombre."
          : "No fue posible guardar la subcategoría.",
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Subcategoría no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, subcategoria: data });
}
