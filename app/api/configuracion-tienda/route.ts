import { NextResponse } from "next/server";
import { obtenerConfiguracionTienda } from "@/app/lib/configuracionTienda";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await obtenerConfiguracionTienda(), {
    headers: { "Cache-Control": "no-store" },
  });
}
