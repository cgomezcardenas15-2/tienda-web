import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PedidoResumen = {
  id: string;
  numero_pedido: string;
  comprador_nombre: string;
  comprador_correo: string;
  entrega_ciudad: string;
  total: number;
  moneda: string;
  estado_pedido: string;
  estado_pago: string;
  creado_en?: string;
};

const dinero = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function estadoClase(estado: string) {
  if (["pagado", "aprobado", "entregado"].includes(estado)) return "bg-lime-400/15 text-lime-300";
  if (["rechazado", "cancelado"].includes(estado)) return "bg-red-500/15 text-red-300";
  return "bg-amber-400/15 text-amber-300";
}

export default async function PedidosAdminPage() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,numero_pedido,comprador_nombre,comprador_correo,entrega_ciudad,total,moneda,estado_pedido,estado_pago,creado_en")
    .order("creado_en", { ascending: false })
    .limit(100);

  const pedidos = (data || []) as PedidoResumen[];
  if (error) {
    console.error("Error cargando pedidos del panel administrativo:", {
      code: error.code,
      message: error.message,
    });
  }
  const pagados = pedidos.filter((pedido) => pedido.estado_pago === "aprobado").length;
  const pendientes = pedidos.filter((pedido) => ["pendiente", "procesando"].includes(pedido.estado_pago)).length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">OPERACIÓN</p>
          <h1 className="mt-2 text-3xl font-black">Pedidos</h1>
          <p className="mt-2 text-sm text-zinc-400">Los 100 pedidos más recientes de NOVA.</p>
        </div>
        <Link href="/admin/pedidos" className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700">
          Actualizar
        </Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pedidos visibles</p><p className="mt-2 text-3xl font-black">{pedidos.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pagos aprobados</p><p className="mt-2 text-3xl font-black text-lime-400">{pagados}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pendientes</p><p className="mt-2 text-3xl font-black text-amber-300">{pendientes}</p></div>
      </section>

      {error ? (
        <p className="mt-7 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">No fue posible cargar los pedidos.</p>
      ) : pedidos.length === 0 ? (
        <p className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Todavía no hay pedidos.</p>
      ) : (
        <div className="mt-7 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Ciudad</th><th className="px-5 py-4">Pago</th><th className="px-5 py-4">Pedido</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-zinc-900/70">
                  <td className="px-5 py-4 text-zinc-400">{pedido.creado_en ? new Date(pedido.creado_en).toLocaleString("es-CO") : "—"}</td>
                  <td className="px-5 py-4"><p className="font-bold text-white">{pedido.comprador_nombre}</p><p className="mt-1 text-xs font-bold text-lime-400">{pedido.numero_pedido}</p><p className="mt-1 text-xs text-zinc-500">{pedido.comprador_correo}</p></td>
                  <td className="px-5 py-4 text-zinc-300">{pedido.entrega_ciudad}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${estadoClase(pedido.estado_pago)}`}>{pedido.estado_pago}</span></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${estadoClase(pedido.estado_pedido)}`}>{pedido.estado_pedido}</span></td>
                  <td className="px-5 py-4 text-right font-black text-white">{dinero.format(Number(pedido.total))}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/pedidos/${pedido.id}`} aria-label={`Ver pedido de ${pedido.comprador_nombre}`} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition hover:border-lime-400 hover:text-lime-300">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                      Ver pedido
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
