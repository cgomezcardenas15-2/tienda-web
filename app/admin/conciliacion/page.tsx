import Link from "next/link";

import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Pedido = {
  id: string;
  numero_pedido: string;
  total: number;
  moneda: string;
  estado_pago: string;
  referencia_pago: string | null;
  proveedor_pago: string | null;
  comprador_nombre: string;
  creado_en: string;
};

type PagoProcesado = {
  pedido_id: string;
  proveedor: string;
  referencia_externa: string;
  monto: number;
  moneda: string;
};

type EstadoConciliacion = "conciliado" | "pendiente" | "diferencia" | "sin_pago";

const dinero = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function analizar(pedido: Pedido, pago?: PagoProcesado) {
  const montoEsperado = Math.round(Number(pedido.total) * 100);
  const pagoAprobado = pedido.estado_pago === "aprobado";

  if (pago) {
    const coincide =
      pago.proveedor === "wompi" &&
      Number(pago.monto) === montoEsperado &&
      pago.moneda === pedido.moneda &&
      pagoAprobado;
    return {
      estado: coincide ? "conciliado" : "diferencia" as EstadoConciliacion,
      detalle: coincide ? "Pedido y pago coinciden" : "Revisar estado, valor o moneda",
    };
  }

  if (pagoAprobado) {
    return { estado: "diferencia" as EstadoConciliacion, detalle: "Aprobado sin registro de pago" };
  }
  if (["pendiente", "procesando"].includes(pedido.estado_pago)) {
    return { estado: "pendiente" as EstadoConciliacion, detalle: "Esperando respuesta de Wompi" };
  }
  return { estado: "sin_pago" as EstadoConciliacion, detalle: "Sin recaudo aprobado" };
}

function claseEstado(estado: EstadoConciliacion) {
  if (estado === "conciliado") return "bg-lime-400/15 text-lime-300";
  if (estado === "diferencia") return "bg-red-500/15 text-red-300";
  if (estado === "pendiente") return "bg-amber-400/15 text-amber-300";
  return "bg-zinc-800 text-zinc-300";
}

function textoEstado(estado: EstadoConciliacion) {
  return { conciliado: "Conciliado", pendiente: "Pendiente", diferencia: "Diferencia", sin_pago: "Sin pago" }[estado];
}

export default async function ConciliacionPage() {
  await requireAdmin();

  const [pedidosResultado, pagosResultado] = await Promise.all([
    supabaseAdmin
      .from("pedidos")
      .select("id,numero_pedido,total,moneda,estado_pago,referencia_pago,proveedor_pago,comprador_nombre,creado_en")
      .order("creado_en", { ascending: false })
      .limit(250),
    supabaseAdmin
      .from("pagos_procesados")
      .select("pedido_id,proveedor,referencia_externa,monto,moneda")
      .eq("proveedor", "wompi")
      .limit(250),
  ]);

  const error = pedidosResultado.error || pagosResultado.error;
  const faltaActivar = Boolean(
    pagosResultado.error &&
    (pagosResultado.error.message.includes("permission denied") ||
      pagosResultado.error.code === "42501")
  );
  if (error) console.error("Error cargando conciliación de pagos:", error.message);

  const pedidos = (pedidosResultado.data ?? []) as Pedido[];
  const pagos = (pagosResultado.data ?? []) as PagoProcesado[];
  const pagosPorPedido = new Map(pagos.map((pago) => [pago.pedido_id, pago]));
  const filas = pedidos.map((pedido) => {
    const pago = pagosPorPedido.get(pedido.id);
    return { pedido, pago, ...analizar(pedido, pago) };
  });
  const conciliados = filas.filter((fila) => fila.estado === "conciliado").length;
  const pendientes = filas.filter((fila) => fila.estado === "pendiente").length;
  const diferencias = filas.filter((fila) => fila.estado === "diferencia").length;
  const totalConciliado = filas
    .filter((fila) => fila.estado === "conciliado")
    .reduce((total, fila) => total + Number(fila.pedido.total), 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">CONTROL DE RECAUDO</p>
          <h1 className="mt-2 text-3xl font-black">Conciliación Wompi</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Compara cada pedido con el pago confirmado antes de considerarlo dinero recibido.</p>
        </div>
        <Link href="/admin/conciliacion" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400 hover:text-lime-300">Actualizar conciliación</Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-lime-500/25 bg-lime-950/20 p-5"><p className="text-sm text-lime-200">Pagos conciliados</p><p className="mt-2 text-3xl font-black text-lime-300">{error ? "—" : conciliados}</p></article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Valor confirmado</p><p className="mt-2 text-3xl font-black">{error ? "—" : dinero.format(totalConciliado)}</p></article>
        <article className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5"><p className="text-sm text-amber-200">Esperando respuesta</p><p className="mt-2 text-3xl font-black text-amber-300">{error ? "—" : pendientes}</p></article>
        <article className="rounded-2xl border border-red-500/25 bg-red-950/20 p-5"><p className="text-sm text-red-200">Diferencias por revisar</p><p className="mt-2 text-3xl font-black text-red-300">{error ? "—" : diferencias}</p></article>
      </section>

      {error ? (
        <section className="mt-7 rounded-2xl border border-amber-700/50 bg-amber-950/30 p-6 text-amber-200">
          <h2 className="font-black">{faltaActivar ? "Falta activar la lectura privada de pagos" : "No fue posible completar la conciliación"}</h2>
          <p className="mt-2 text-sm text-amber-100/70">{faltaActivar ? "Ejecuta activar_conciliacion_wompi.sql en Supabase y vuelve a esta página." : "Los pedidos y pagos siguen guardados. Actualiza la página en unos segundos."}</p>
        </section>
      ) : filas.length === 0 ? (
        <section className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h2 className="text-xl font-black">Todavía no hay movimientos para conciliar</h2>
          <p className="mt-2 text-sm text-zinc-400">La primera compra aparecerá aquí cuando se genere el pedido.</p>
        </section>
      ) : (
        <section className="mt-7 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-900 p-5"><h2 className="text-xl font-black">Movimientos recientes</h2><p className="mt-1 text-sm text-zinc-400">Hasta 250 pedidos, ordenados del más reciente al más antiguo.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-black text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Pedido</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Referencia</th><th className="px-5 py-4">Transacción Wompi</th><th className="px-5 py-4 text-right">Esperado</th><th className="px-5 py-4 text-right">Registrado</th><th className="px-5 py-4">Resultado</th><th className="px-5 py-4 text-right">Acción</th></tr></thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {filas.map(({ pedido, pago, estado, detalle }) => (
                  <tr key={pedido.id} className="hover:bg-zinc-900/70">
                    <td className="px-5 py-4"><p className="font-black text-lime-400">{pedido.numero_pedido}</p><p className="mt-1 text-xs text-zinc-500">{new Date(pedido.creado_en).toLocaleString("es-CO")}</p></td>
                    <td className="px-5 py-4 font-bold">{pedido.comprador_nombre}</td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-300">{pedido.referencia_pago || "—"}</td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-300">{pago?.referencia_externa || "—"}</td>
                    <td className="px-5 py-4 text-right font-bold">{dinero.format(Number(pedido.total))}</td>
                    <td className="px-5 py-4 text-right font-bold">{pago ? dinero.format(Number(pago.monto) / 100) : "—"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${claseEstado(estado)}`}>{textoEstado(estado)}</span><p className="mt-2 text-xs text-zinc-500">{detalle}</p></td>
                    <td className="px-5 py-4 text-right"><Link href={`/admin/pedidos/${pedido.id}`} className="whitespace-nowrap rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400 hover:text-lime-300">Ver pedido</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-7 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 text-sm text-blue-100">
        <h2 className="font-black">Cómo interpretar el resultado</h2>
        <p className="mt-2 text-blue-100/75"><strong>Conciliado</strong> significa que el pedido está aprobado y coincide con el registro de Wompi en valor y moneda. Una <strong>Diferencia</strong> requiere revisión antes de preparar o despachar el pedido.</p>
      </section>
    </main>
  );
}
