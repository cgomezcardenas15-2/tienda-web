import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { crearCsv, respuestaCsv } from "@/app/lib/csv";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("movimientos_inventario")
    .select("creado_en,producto_nombre,variante_nombre,sku,tipo,cantidad_anterior,diferencia,cantidad_nueva")
    .order("creado_en", { ascending: false }).limit(5000);
  if (error) {
    console.error("Error exportando movimientos:", error.message);
    return NextResponse.json({ error: "No fue posible exportar el historial." }, { status: 500 });
  }
  const encabezados=["Fecha","Producto","Variante","SKU","Tipo","Cantidad anterior","Diferencia","Cantidad nueva"];
  const filas=(data??[]).map((fila)=>[fila.creado_en,fila.producto_nombre,fila.variante_nombre,fila.sku,fila.tipo,fila.cantidad_anterior,fila.diferencia,fila.cantidad_nueva]);
  return respuestaCsv(crearCsv(encabezados,filas),`nova-movimientos-inventario-${new Date().toISOString().slice(0,10)}.csv`);
}
