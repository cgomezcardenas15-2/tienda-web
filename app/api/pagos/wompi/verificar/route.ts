import { NextResponse } from "next/server";

import {
  ErrorVerificacionPago,
  verificarYActualizarPagoWompi,
} from "@/app/lib/verificarPagoWompi";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();

    if (!id || id.length > 160) {
      return NextResponse.json({ ok: false, error: "La transacción no es válida." }, { status: 400 });
    }

    const resultado = await verificarYActualizarPagoWompi(id);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    if (error instanceof ErrorVerificacionPago) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Error verificando pago Wompi:", error);
    return NextResponse.json(
      { ok: false, error: "No fue posible verificar el pago con Wompi." },
      { status: 502 }
    );
  }
}
