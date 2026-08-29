import { NextResponse } from "next/server";
import { obtenerConfiguracionEnvios } from "@/app/lib/configuracionEnvios";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuracion = await obtenerConfiguracionEnvios();
  return NextResponse.json(configuracion, {
    headers: { "Cache-Control": "no-store" },
  });
}
