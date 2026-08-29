import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function entero(valor: unknown) {
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isInteger(numero) ? numero : Number.NaN;
}

export async function PATCH(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });

  const tarifaCali = entero(body.tarifaCali);
  const tarifaValle = entero(body.tarifaValle);
  const tarifaNacional = entero(body.tarifaNacional);
  const envioGratisDesde = entero(body.envioGratisDesde);
  if ([tarifaCali, tarifaValle, tarifaNacional, envioGratisDesde].some((valor) => !Number.isInteger(valor) || valor < 0)) {
    return NextResponse.json({ error: "Las tarifas deben ser números completos iguales o mayores a cero." }, { status: 400 });
  }
  if (body.envioGratisActivo === true && envioGratisDesde <= 0) {
    return NextResponse.json({ error: "Indica desde qué valor se ofrecerá el envío gratis." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("configuracion_envios").upsert({
    id: true,
    tarifa_cali: tarifaCali,
    tarifa_valle: tarifaValle,
    tarifa_nacional: tarifaNacional,
    envio_gratis_activo: body.envioGratisActivo === true,
    envio_gratis_desde: envioGratisDesde,
    actualizado_en: new Date().toISOString(),
  });
  if (error) {
    console.error("Error actualizando envíos:", { code: error.code, message: error.message });
    return NextResponse.json({ error: "No fue posible actualizar las tarifas." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
