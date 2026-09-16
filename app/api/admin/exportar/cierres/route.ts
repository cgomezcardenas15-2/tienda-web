import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { reporteCierres } from "@/app/lib/reportesCajaExcel";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 }); const { data, error } = await supabaseAdmin.from("cierres_diarios").select("fecha,ventas_aprobadas,reembolsos,gastos,comisiones_pagadas,saldo_esperado,saldo_reportado,diferencia,observaciones,creado_en").order("fecha", { ascending: false }).limit(5000); if (error) return NextResponse.json({ error: "No fue posible exportar los cierres." }, { status: 500 }); const buffer = await reporteCierres(data ?? []); return new Response(Buffer.from(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="senor-nova-cierres-${new Date().toISOString().slice(0, 10)}.xlsx"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); }
