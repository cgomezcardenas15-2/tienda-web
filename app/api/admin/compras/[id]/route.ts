import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const { id } = await params; const { estado } = await request.json();
  if (!["ordenada", "recibida", "anulada"].includes(estado)) return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
  const { data: compra } = await supabaseAdmin.from("compras").select("estado").eq("id", id).maybeSingle();
  if (!compra) return NextResponse.json({ error: "La compra no existe." }, { status: 404 });
  const permitidos: Record<string, string[]> = { borrador: ["ordenada", "anulada"], ordenada: ["recibida", "anulada"] };
  if (!permitidos[compra.estado]?.includes(estado)) return NextResponse.json({ error: "Ese cambio de estado no está permitido." }, { status: 400 });
  if (estado === "recibida") {
    const { data: lineas } = await supabaseAdmin.from("productos_compra").select("producto_id").eq("compra_id", id);
    if (!lineas?.length || lineas.some(linea => !linea.producto_id)) return NextResponse.json({ error: "Primero vincula todos los productos con el inventario de NOVA." }, { status: 400 });
    const { data, error } = await supabaseAdmin.rpc("recibir_compra_inventario", { p_compra_id: id });
    if (error) return NextResponse.json({ error: error.code === "PGRST202" ? "Falta activar la recepción de compras en Supabase." : "No fue posible recibir la compra ni actualizar el inventario." }, { status: 400 });
    return NextResponse.json({ ok: true, resultado: data });
  }
  const { error } = await supabaseAdmin.from("compras").update({ estado, actualizado_en: new Date().toISOString() }).eq("id", id);
  return error ? NextResponse.json({ error: "No fue posible cambiar el estado." }, { status: 400 }) : NextResponse.json({ ok: true });
}
