import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type AccionContraentrega = "confirmar_entrega" | "cancelar";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { accion?: unknown } | null;
  const accion = body?.accion as AccionContraentrega | undefined;
  if (!accion || !["confirmar_entrega", "cancelar"].includes(accion)) {
    return NextResponse.json({ error: "La acción solicitada no es válida." }, { status: 400 });
  }

  const { id } = await params;
  const funcion = accion === "confirmar_entrega"
    ? "confirmar_entrega_contraentrega"
    : "cancelar_pedido_contraentrega";
  const { data, error } = await supabaseAdmin.rpc(funcion, { p_pedido_id: id });

  if (error) {
    console.error(`Error ejecutando ${funcion}:`, { code: error.code, message: error.message });
    const mensaje = error.message.includes("debe estar en reparto")
      ? "Marca primero el pedido como en reparto."
      : error.message.includes("ya cobrado")
        ? "Este pedido ya fue cobrado y no puede cancelarse."
        : "No fue posible actualizar el pedido contraentrega.";
    return NextResponse.json({ error: mensaje }, { status: 409 });
  }

  return NextResponse.json({ ok: true, resultado: data });
}
