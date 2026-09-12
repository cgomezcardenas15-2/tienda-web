import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; lineaId: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const { id, lineaId } = await params; const body = await request.json();
  const productoId = typeof body.producto_id === "string" ? body.producto_id : "";
  const varianteId = typeof body.variante_id === "string" && body.variante_id ? body.variante_id : null;
  const { data: compra } = await supabaseAdmin.from("compras").select("estado").eq("id", id).maybeSingle();
  if (!compra || ["recibida", "anulada"].includes(compra.estado)) return NextResponse.json({ error: "Esta compra ya no se puede modificar." }, { status: 400 });
  const { data: producto } = await supabaseAdmin.from("productos").select("id,activo").eq("id", productoId).maybeSingle();
  if (!producto?.activo) return NextResponse.json({ error: "El producto seleccionado no está disponible." }, { status: 400 });
  if (varianteId) { const { data: variante } = await supabaseAdmin.from("variantes_producto").select("id,producto_id,activo").eq("id", varianteId).maybeSingle(); if (!variante?.activo || variante.producto_id !== productoId) return NextResponse.json({ error: "La variante no corresponde al producto." }, { status: 400 }); }
  const { data: linea, error } = await supabaseAdmin.from("productos_compra").update({ producto_id: productoId, variante_id: varianteId }).eq("id", lineaId).eq("compra_id", id).select("id").maybeSingle();
  if (error || !linea) return NextResponse.json({ error: "No fue posible vincular el producto." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
