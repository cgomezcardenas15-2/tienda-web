import { NextResponse } from "next/server";
import { obtenerConfiguracionTienda } from "@/app/lib/configuracionTienda";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await obtenerConfiguracionTienda(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error en GET /api/configuracion-tienda:", error);
    return NextResponse.json(
      {
        ok: false,
        codigo: "CONFIGURACION_NO_DISPONIBLE",
        error: "No pudimos verificar las condiciones de compra. Intenta nuevamente.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
