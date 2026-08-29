import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { crearCheckoutWompi, type PedidoParaPago } from "@/app/lib/iniciarPagoPedido";

const NUMERO = /^NOVA-\d{6,}$/i;
const intentos = new Map<string, { cantidad: number; reinicio: number }>();

function bloqueado(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  const ahora = Date.now();
  const actual = intentos.get(ip);
  if (!actual || actual.reinicio <= ahora) {
    intentos.set(ip, { cantidad: 1, reinicio: ahora + 15 * 60 * 1000 });
    return false;
  }
  actual.cantidad += 1;
  return actual.cantidad > 10;
}

export async function POST(request: Request) {
  try {
    if (bloqueado(request)) return NextResponse.json({ error: "Realizaste demasiados intentos. Espera 15 minutos." }, { status: 429 });
    const body = await request.json().catch(() => null) as { pedido?: unknown; correo?: unknown } | null;
    const numero = typeof body?.pedido === "string" ? body.pedido.trim().toUpperCase() : "";
    const correo = typeof body?.correo === "string" ? body.correo.trim().toLowerCase() : "";
    if (!NUMERO.test(numero) || !/^\S+@\S+\.\S+$/.test(correo)) {
      return NextResponse.json({ error: "Revisa el número del pedido y el correo." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from("pedidos")
      .select("id,numero_pedido,total,moneda,estado_pago,estado_pedido,referencia_pago,comprador_nombre,comprador_correo,comprador_telefono,comprador_tipo_documento,comprador_numero_documento")
      .eq("numero_pedido", numero).ilike("comprador_correo", correo).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "No encontramos el pedido." }, { status: 404 });
    if (data.estado_pedido === "cancelado") return NextResponse.json({ error: "Este pedido está cancelado." }, { status: 409 });
    const checkoutUrl = await crearCheckoutWompi(data as PedidoParaPago, request.url);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "PAGO_APROBADO") {
      return NextResponse.json({ error: "Este pedido ya está pagado." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "STOCK_NO_DISPONIBLE") {
      return NextResponse.json({ error: "Las unidades ya no están disponibles. Comunícate con NOVA para revisar el pedido." }, { status: 409 });
    }
    console.error("Error retomando pago:", error);
    return NextResponse.json({ error: "No fue posible retomar el pago." }, { status: 500 });
  }
}
