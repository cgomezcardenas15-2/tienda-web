import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { errorValidacionProducto, limpiarProducto } from "../route";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const datos = limpiarProducto(body);
  const validacion = errorValidacionProducto(datos);
  if (validacion) return NextResponse.json({ error: validacion }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("productos").update(datos).eq("id", id).select("*").maybeSingle();
  if (error) {
    console.error("Error actualizando producto:", { code: error.code, message: error.message });
    const mensaje = error.code === "23505"
      ? "Ya existe un producto con ese nombre o SKU."
      : process.env.NODE_ENV === "development"
        ? `No fue posible actualizar: ${error.message}`
        : "No fue posible actualizar el producto.";
    return NextResponse.json({ error: mensaje }, { status: 409 });
  }
  if (!data) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, producto: data });
}
