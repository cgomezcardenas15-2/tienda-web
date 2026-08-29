import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const intentos = new Map<string, { cantidad: number; reinicio: number }>();
const LIMITE = 10;
const VENTANA = 15 * 60 * 1000;
const NUMERO_PEDIDO = /^NOVA-\d{6,}$/i;

function ipCliente(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
}

function excedioLimite(ip: string) {
  const ahora = Date.now();
  const actual = intentos.get(ip);
  if (!actual || actual.reinicio <= ahora) {
    intentos.set(ip, { cantidad: 1, reinicio: ahora + VENTANA });
    return false;
  }
  actual.cantidad += 1;
  return actual.cantidad > LIMITE;
}

function limpiarIdentificador(valor: unknown) {
  if (typeof valor !== "string") return "";
  return valor.trim().toUpperCase();
}

export async function POST(request: NextRequest) {
  if (excedioLimite(ipCliente(request))) {
    return NextResponse.json({ error: "Realizaste demasiados intentos. Espera 15 minutos e inténtalo nuevamente." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { pedido?: unknown; correo?: unknown } | null;
  const numeroPedido = limpiarIdentificador(body?.pedido);
  const correo = typeof body?.correo === "string" ? body.correo.trim().toLowerCase() : "";
  if (!NUMERO_PEDIDO.test(numeroPedido) || !/^\S+@\S+\.\S+$/.test(correo) || correo.length > 254) {
    return NextResponse.json({ error: "Revisa el número del pedido y el correo." }, { status: 400 });
  }

  const { data: pedido, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,numero_pedido,creado_en,total,moneda,estado_pago,estado_pedido,envio_transportadora,envio_servicio,envio_numero_guia,envio_url_seguimiento")
    .eq("numero_pedido", numeroPedido)
    .ilike("comprador_correo", correo)
    .maybeSingle();

  if (error) {
    console.error("Error consultando pedido público:", { code: error.code, message: error.message });
    return NextResponse.json({ error: "No fue posible consultar el pedido en este momento." }, { status: 500 });
  }
  if (!pedido) {
    return NextResponse.json({ error: "No encontramos un pedido que coincida con esos datos." }, { status: 404 });
  }

  const { data: productos, error: productosError } = await supabaseAdmin
    .from("productos_pedido")
    .select("id,nombre,cantidad,variante_nombre")
    .eq("pedido_id", pedido.id);
  if (productosError) console.error("Error cargando productos para consulta pública:", productosError.message);

  return NextResponse.json({
    pedido: {
      numeroPedido: pedido.numero_pedido,
      creadoEn: pedido.creado_en,
      total: Number(pedido.total),
      moneda: pedido.moneda,
      estadoPago: pedido.estado_pago,
      estadoPedido: pedido.estado_pedido,
      puedeRetomarPago: pedido.estado_pago !== "aprobado" && pedido.estado_pedido !== "cancelado",
      envio: {
        transportadora: pedido.envio_transportadora || null,
        servicio: pedido.envio_servicio || null,
        numeroGuia: pedido.envio_numero_guia || null,
        urlSeguimiento: pedido.envio_url_seguimiento || null,
      },
      productos: productosError ? [] : (productos || []).map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: Number(producto.cantidad),
        variante: producto.variante_nombre || null,
      })),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
