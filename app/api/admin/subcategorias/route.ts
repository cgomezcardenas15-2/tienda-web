import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { slugCategoria } from "@/app/lib/categoriasProducto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!await getAdminSession()) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const categoriaId = typeof body?.categoria_id === "string" ? body.categoria_id.trim() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const orden = Number(body?.orden);
  const slug = slugCategoria(nombre);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoriaId)
    || !nombre || nombre.length > 80 || !slug || descripcion.length > 180
    || !Number.isInteger(orden) || orden < 0) {
    return NextResponse.json({ error: "Completa correctamente el nombre y el orden." }, { status: 400 });
  }

  const { data: categoria, error: errorCategoria } = await supabaseAdmin
    .from("categorias_producto")
    .select("id")
    .eq("id", categoriaId)
    .maybeSingle();

  if (errorCategoria) {
    return NextResponse.json({ error: "No fue posible verificar la categoría." }, { status: 500 });
  }
  if (!categoria) {
    return NextResponse.json({ error: "La categoría principal no existe." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("subcategorias_producto")
    .insert({
      categoria_id: categoriaId,
      nombre,
      slug,
      descripcion,
      orden,
      activo: true,
    })
    .select("id,categoria_id,nombre,slug,descripcion,activo,orden")
    .single();

  if (error) {
    return NextResponse.json({
      error: error.code === "23505"
        ? "Ya existe una subcategoría con ese nombre."
        : "No fue posible crear la subcategoría.",
    }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ ok: true, subcategoria: data }, { status: 201 });
}
