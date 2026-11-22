import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const intentos = new Map<string, { cantidad: number; reinicio: number }>();
const LIMITE = 10;
const VENTANA = 15 * 60 * 1000;
const NUMERO_PEDIDO = /^NOVA-\d{6,}$/i;
const CAMPOS_PEDIDO_BASE = "id,numero_pedido,creado_en,subtotal,costo_envio,total,moneda,estado_pago,estado_pedido,metodo_pago,envio_zona,envio_mensaje,envio_transportadora,envio_servicio,envio_numero_guia,envio_url_seguimiento";

type PedidoConsulta = {
  id: string;
  numero_pedido: string;
  creado_en: string;
  subtotal: number;
  costo_envio: number;
  total: number;
  moneda: string;
  estado_pago: string;
  estado_pedido: string;
  metodo_pago: string;
  envio_zona: string | null;
  envio_mensaje: string | null;
  envio_valor_confirmado?: number | null;
  envio_pago_recibido?: boolean | null;
  envio_transportadora: string | null;
  envio_servicio: string | null;
  envio_numero_guia: string | null;
  envio_url_seguimiento: string | null;
};

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

  const { error: errorLimpieza } = await supabaseAdmin.rpc("liberar_reservas_vencidas");
  if (errorLimpieza) console.error("Error limpiando reservas vencidas:", errorLimpieza.message);

  const consultaPedido = await supabaseAdmin
    .from("pedidos")
    .select(`${CAMPOS_PEDIDO_BASE},envio_valor_confirmado,envio_pago_recibido`)
    .eq("numero_pedido", numeroPedido)
    .ilike("comprador_correo", correo)
    .maybeSingle();

  let pedido = consultaPedido.data as PedidoConsulta | null;
  let error = consultaPedido.error;

  // Permite desplegar la interfaz antes de ejecutar la migración sin dejar
  // inservible la consulta de pedidos históricos.
  if (error?.code === "42703") {
    const consultaCompatible = await supabaseAdmin
      .from("pedidos")
      .select(CAMPOS_PEDIDO_BASE)
      .eq("numero_pedido", numeroPedido)
      .ilike("comprador_correo", correo)
      .maybeSingle();
    pedido = consultaCompatible.data as PedidoConsulta | null;
    error = consultaCompatible.error;
  }

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

  const costoEnvio = Number(pedido.costo_envio || 0);
  const zonaEnvio = typeof pedido.envio_zona === "string" ? pedido.envio_zona.toUpperCase() : "";
  const mensajeEnvio = typeof pedido.envio_mensaje === "string" ? pedido.envio_mensaje.trim() : "";
  const mensajeNormalizado = mensajeEnvio.toLocaleLowerCase("es-CO");
  const valorConfirmadoNumero = Number(pedido.envio_valor_confirmado);
  const valorConfirmado = zonaEnvio === "CALI" && Number.isFinite(valorConfirmadoNumero) && valorConfirmadoNumero > 0
    ? Math.round(valorConfirmadoNumero)
    : null;
  const pagoAlRecibir = (
    mensajeNormalizado.includes("recib")
    && (mensajeNormalizado.includes("paga") || mensajeNormalizado.includes("pago"))
  ) || (costoEnvio === 0 && zonaEnvio !== "CALI");

  return NextResponse.json({
    pedido: {
      numeroPedido: pedido.numero_pedido,
      creadoEn: pedido.creado_en,
      subtotal: Number(pedido.subtotal),
      costoEnvio,
      total: Number(pedido.total),
      moneda: pedido.moneda,
      estadoPago: pedido.estado_pago,
      estadoPedido: pedido.estado_pedido,
      metodoPago: pedido.metodo_pago,
      puedeRetomarPago: pedido.metodo_pago !== "contraentrega" && pedido.estado_pago !== "aprobado" && pedido.estado_pedido !== "cancelado",
      envio: {
        zona: pedido.envio_zona || null,
        mensaje: mensajeEnvio || null,
        pagoAlRecibir,
        valorConfirmado,
        pagoRecibido: valorConfirmado !== null && pedido.envio_pago_recibido === true,
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
