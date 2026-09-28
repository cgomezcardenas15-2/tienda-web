import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { errorValidacionProducto, limpiarProducto } from "@/app/lib/productoAdmin";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiarProducto(body);
  const validacion = errorValidacionProducto(datos);
  if (validacion) return NextResponse.json({ error: validacion }, { status: 400 });
  const { data: categoria } = await supabaseAdmin.from("categorias_producto").select("id").eq("nombre", datos.categoria).eq("activo", true).maybeSingle();
  if (!categoria) return NextResponse.json({ error: "La categoría seleccionada no existe o está desactivada." }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("productos").insert(datos).select("*").single();
  if (error) {
    console.error("Error creando producto:", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.code === "23505" ? "Ya existe un producto con ese nombre o SKU." : "No fue posible crear el producto." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, producto: data }, { status: 201 });
}
