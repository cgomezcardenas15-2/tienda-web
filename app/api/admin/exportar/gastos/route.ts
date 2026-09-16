import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { reporteGastos } from "@/app/lib/reportesCajaExcel";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 }); const { data, error } = await supabaseAdmin.from("gastos").select("fecha,descripcion,valor,medio_pago,comprobante,recurrente,estado,notas,creado_en,categorias_gasto(nombre)").order("fecha", { ascending: false }).order("creado_en", { ascending: false }).limit(10000); if (error) return NextResponse.json({ error: "No fue posible exportar los gastos." }, { status: 500 }); const buffer = await reporteGastos(data ?? []); return new Response(Buffer.from(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="senor-nova-gastos-${new Date().toISOString().slice(0, 10)}.xlsx"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); }
