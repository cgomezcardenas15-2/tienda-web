import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const monto = Number(body?.montoMinimoCompra);
  if (!Number.isInteger(monto) || monto < 0) {
    return NextResponse.json({ error: "El monto mínimo debe ser un número completo igual o mayor a cero." }, { status: 400 });
  }
  if (body?.compraMinimaActiva === true && monto <= 0) {
    return NextResponse.json({ error: "Indica un monto mayor a cero antes de activar la compra mínima." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("configuracion_tienda").upsert({
    id: true,
    compra_minima_activa: body?.compraMinimaActiva === true,
    monto_minimo_compra: monto,
    actualizado_en: new Date().toISOString(),
  });
  if (error) {
    console.error("Error actualizando configuración de tienda:", { code: error.code, message: error.message });
    return NextResponse.json({ error: "No fue posible guardar la configuración." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
