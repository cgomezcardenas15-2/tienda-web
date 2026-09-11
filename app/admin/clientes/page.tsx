import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PedidoCliente = {
  id: string;
  numero_pedido: string;
  comprador_nombre: string;
  comprador_correo: string;
  comprador_telefono: string;
  comprador_tipo_documento: string;
  comprador_numero_documento: string;
  entrega_ciudad: string;
  total: number;
  estado_pago: string;
  creado_en: string;
};

type ClienteResumen = {
  clave: string;
  pedidoReferenciaId: string;
  nombre: string;
  correo: string;
  telefono: string;
  documento: string;
  ciudad: string;
  cantidadPedidos: number;
  comprasAprobadas: number;
  totalPagado: number;
  ultimaCompra: string;
};

const dinero = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function normalizar(valor: string | null | undefined) {
  return (valor || "").trim().toLocaleLowerCase("es-CO");
}

function claveCliente(pedido: PedidoCliente) {
  const documento = normalizar(pedido.comprador_numero_documento).replace(/\D/g, "");
  return documento ? `documento:${documento}` : `correo:${normalizar(pedido.comprador_correo)}`;
}

function resumirClientes(pedidos: PedidoCliente[]) {
  const clientes = new Map<string, ClienteResumen>();

  for (const pedido of pedidos) {
    const clave = claveCliente(pedido);
    const existente = clientes.get(clave);
    const pagoAprobado = pedido.estado_pago === "aprobado";

    if (!existente) {
      clientes.set(clave, {
        clave,
        pedidoReferenciaId: pedido.id,
        nombre: pedido.comprador_nombre,
        correo: pedido.comprador_correo,
        telefono: pedido.comprador_telefono,
        documento: `${pedido.comprador_tipo_documento} ${pedido.comprador_numero_documento}`,
        ciudad: pedido.entrega_ciudad,
        cantidadPedidos: 1,
        comprasAprobadas: pagoAprobado ? 1 : 0,
        totalPagado: pagoAprobado ? Number(pedido.total) : 0,
        ultimaCompra: pedido.creado_en,
      });
      continue;
    }

    existente.cantidadPedidos += 1;
    if (pagoAprobado) {
      existente.comprasAprobadas += 1;
      existente.totalPagado += Number(pedido.total);
    }
  }

  return [...clientes.values()];
}

export default async function ClientesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  await requireAdmin();
  const { buscar = "" } = await searchParams;

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("id,numero_pedido,comprador_nombre,comprador_correo,comprador_telefono,comprador_tipo_documento,comprador_numero_documento,entrega_ciudad,total,estado_pago,creado_en")
    .order("creado_en", { ascending: false })
    .limit(1000);

  const clientes = resumirClientes((data || []) as PedidoCliente[]);
  const consulta = normalizar(buscar);
  const clientesVisibles = consulta
    ? clientes.filter((cliente) =>
        [cliente.nombre, cliente.correo, cliente.telefono, cliente.documento, cliente.ciudad]
          .some((valor) => normalizar(valor).includes(consulta)),
      )
    : clientes;
  const clientesRecurrentes = clientes.filter((cliente) => cliente.cantidadPedidos > 1).length;
  const totalPagado = clientes.reduce((total, cliente) => total + cliente.totalPagado, 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">RELACIONES COMERCIALES</p>
          <h1 className="mt-2 text-3xl font-black">Clientes</h1>
          <p className="mt-2 text-sm text-zinc-400">Información consolidada de quienes han realizado pedidos en NOVA.</p>
        </div>
        <Link href="/admin/clientes" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-lime-400 hover:text-lime-300">Actualizar</Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Clientes registrados</p><p className="mt-2 text-3xl font-black">{clientes.length}</p></article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Clientes recurrentes</p><p className="mt-2 text-3xl font-black text-lime-400">{clientesRecurrentes}</p></article>
        <article className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.05] p-5"><p className="text-sm text-lime-200/70">Valor de compras aprobadas</p><p className="mt-2 text-3xl font-black text-lime-300">{dinero.format(totalPagado)}</p></article>
      </section>

      <form className="mt-7 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row" action="/admin/clientes">
        <label className="sr-only" htmlFor="buscar-cliente">Buscar cliente</label>
        <input id="buscar-cliente" name="buscar" defaultValue={buscar} placeholder="Buscar por nombre, documento, teléfono, correo o ciudad" className="min-h-12 flex-1 rounded-xl border border-zinc-700 bg-black px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-lime-400" />
        <button className="min-h-12 rounded-xl bg-[#82f000] px-6 font-black text-black transition hover:bg-[#9cff35]">Buscar</button>
        {buscar ? <Link href="/admin/clientes" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 px-5 font-bold text-zinc-300 hover:border-zinc-500 hover:text-white">Limpiar</Link> : null}
      </form>

      {error ? (
        <p className="mt-7 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">No fue posible cargar los clientes.</p>
      ) : clientesVisibles.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 p-10 text-center">
          <p className="text-lg font-black">{buscar ? "No encontramos coincidencias" : "Todavía no hay clientes"}</p>
          <p className="mt-2 text-sm text-zinc-400">{buscar ? "Prueba con otro nombre, documento, teléfono, correo o ciudad." : "Los clientes aparecerán automáticamente cuando realicen su primer pedido."}</p>
        </div>
      ) : (
        <div className="mt-7 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Contacto</th><th className="px-5 py-4">Ciudad</th><th className="px-5 py-4 text-center">Pedidos</th><th className="px-5 py-4 text-right">Total pagado</th><th className="px-5 py-4">Última compra</th><th className="px-5 py-4 text-right">Acción</th></tr></thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950">
              {clientesVisibles.map((cliente) => (
                <tr key={cliente.clave} className="transition hover:bg-zinc-900/70">
                  <td className="px-5 py-4"><p className="font-bold text-white">{cliente.nombre}</p><p className="mt-1 text-xs text-zinc-500">{cliente.documento}</p></td>
                  <td className="px-5 py-4"><p className="text-zinc-300">{cliente.telefono}</p><p className="mt-1 text-xs text-zinc-500">{cliente.correo}</p></td>
                  <td className="px-5 py-4 text-zinc-300">{cliente.ciudad || "—"}</td>
                  <td className="px-5 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full bg-zinc-800 px-2.5 py-1 font-black text-white">{cliente.cantidadPedidos}</span></td>
                  <td className="px-5 py-4 text-right font-black text-lime-400">{dinero.format(cliente.totalPagado)}</td>
                  <td className="px-5 py-4 text-zinc-400">{cliente.ultimaCompra ? new Date(cliente.ultimaCompra).toLocaleDateString("es-CO") : "—"}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/admin/clientes/${cliente.pedidoReferenciaId}`} className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-white transition hover:border-lime-400 hover:text-lime-300">Ver cliente</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
