import "server-only";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function cargarRemision(id: string) {
  const [{ data: pedido, error }, { data: productos, error: productosError }] = await Promise.all([
    supabaseAdmin.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("productos_pedido").select("*").eq("pedido_id", id).order("id"),
  ]);
  if (error || !pedido) return null;
  if (productosError) throw new Error("No fue posible cargar los productos de la remisión.");
  return { pedido, productos: productos || [] };
}

export function textoRemision(valor: unknown, alternativa = "-") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : alternativa;
}

export function nombreArchivoRemision(numero: unknown, extension: string) {
  return `Remision-${String(numero).replace(/[^A-Za-z0-9-]/g, "")}.${extension}`;
}
