import Link from "next/link";
import { notFound } from "next/navigation";
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
  comprador_razon_social?: string | null;
  comprador_dv?: string | null;
  entrega_departamento: string;
  entrega_ciudad: string;
  entrega_direccion: string;
  entrega_complemento?: string | null;
  facturacion_nombre: string;
  facturacion_tipo_documento: string;
  facturacion_numero_documento: string;
  facturacion_razon_social?: string | null;
  facturacion_dv?: string | null;
  facturacion_correo: string;
  facturacion_departamento: string;
  facturacion_ciudad: string;
  facturacion_direccion: string;
  total: number;
  estado_pago: string;
  estado_pedido: string;
  creado_en: string;
};

const dinero = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function soloDigitos(valor: string | null | undefined) {
  return (valor || "").replace(/\D/g, "");
}

function enlaceWhatsApp(telefono: string, nombre: string) {
  const digitos = soloDigitos(telefono);
  const numero = digitos.length === 10 ? `57${digitos}` : digitos;
  const mensaje = encodeURIComponent(`Hola ${nombre}, te escribimos de NOVA.`);
  return `https://wa.me/${numero}?text=${mensaje}`;
}

function estadoTexto(estado: string) {
  const textos: Record<string, string> = {
    pendiente: "Pendiente",
    procesando: "Procesando",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    cancelado: "Cancelado",
    vencido: "Pago vencido",
    pendiente_pago: "Pendiente de pago",
    pagado: "Pagado",
    preparando: "Preparando",
    enviado: "Enviado",
    entregado: "Entregado",
  };
  return textos[estado] || estado.replaceAll("_", " ");
}

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const { data: pedidoReferencia, error } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !pedidoReferencia) notFound();

  const documento = soloDigitos(pedidoReferencia.comprador_numero_documento);
  const correo = String(pedidoReferencia.comprador_correo || "").trim();

  const [{ data: porDocumento }, { data: porCorreo }] = await Promise.all([
    documento
      ? supabaseAdmin.from("pedidos").select("*").eq("comprador_numero_documento", pedidoReferencia.comprador_numero_documento).order("creado_en", { ascending: false }).limit(500)
      : Promise.resolve({ data: [] }),
    correo
      ? supabaseAdmin.from("pedidos").select("*").ilike("comprador_correo", correo).order("creado_en", { ascending: false }).limit(500)
      : Promise.resolve({ data: [] }),
  ]);

  const pedidosPorId = new Map<string, PedidoCliente>();
  for (const pedido of [...(porDocumento || []), ...(porCorreo || [])] as PedidoCliente[]) {
    pedidosPorId.set(pedido.id, pedido);
  }
  pedidosPorId.set(pedidoReferencia.id, pedidoReferencia as PedidoCliente);
  const pedidos = [...pedidosPorId.values()].sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
  const cliente = pedidos[0];
  const aprobados = pedidos.filter((pedido) => pedido.estado_pago === "aprobado");
  const totalPagado = aprobados.reduce((total, pedido) => total + Number(pedido.total), 0);
  const direcciones = [...new Map(pedidos.map((pedido) => {
    const texto = [pedido.entrega_direccion, pedido.entrega_complemento, pedido.entrega_ciudad, pedido.entrega_departamento].filter(Boolean).join(", ");
    return [texto.toLocaleLowerCase("es-CO"), texto];
  })).values()];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/admin/clientes" className="text-sm font-bold text-lime-400 hover:text-lime-300">← Volver a clientes</Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">FICHA DEL CLIENTE</p>
          <h1 className="mt-2 text-3xl font-black">{cliente.comprador_nombre}</h1>
          <p className="mt-2 text-sm text-zinc-400">Cliente desde {new Date(pedidos[pedidos.length - 1].creado_en).toLocaleDateString("es-CO")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {soloDigitos(cliente.comprador_telefono) ? <a href={enlaceWhatsApp(cliente.comprador_telefono, cliente.comprador_nombre)} target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-black text-black transition hover:bg-[#4be07f]">Escribir por WhatsApp</a> : null}
          {cliente.comprador_correo ? <a href={`mailto:${cliente.comprador_correo}`} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-bold text-white transition hover:border-lime-400 hover:text-lime-300">Enviar correo</a> : null}
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pedidos realizados</p><p className="mt-2 text-3xl font-black">{pedidos.length}</p></article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Compras aprobadas</p><p className="mt-2 text-3xl font-black text-lime-400">{aprobados.length}</p></article>
        <article className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.05] p-5 sm:col-span-2"><p className="text-sm text-lime-200/70">Total pagado</p><p className="mt-2 text-3xl font-black text-lime-300">{dinero.format(totalPagado)}</p></article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-black">Identificación y contacto</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-500">Nombre</dt><dd className="mt-1 font-semibold">{cliente.comprador_nombre}</dd></div>
            <div><dt className="text-zinc-500">Documento</dt><dd className="mt-1 font-semibold">{cliente.comprador_tipo_documento} {cliente.comprador_numero_documento}{cliente.comprador_dv ? `-${cliente.comprador_dv}` : ""}</dd></div>
            <div><dt className="text-zinc-500">Teléfono</dt><dd className="mt-1 font-semibold">{cliente.comprador_telefono}</dd></div>
            <div><dt className="text-zinc-500">Correo</dt><dd className="mt-1 break-all font-semibold">{cliente.comprador_correo}</dd></div>
            {cliente.comprador_razon_social ? <div className="sm:col-span-2"><dt className="text-zinc-500">Razón social</dt><dd className="mt-1 font-semibold">{cliente.comprador_razon_social}</dd></div> : null}
          </dl>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-black">Datos para facturación</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-500">Nombre o empresa</dt><dd className="mt-1 font-semibold">{cliente.facturacion_razon_social || cliente.facturacion_nombre}</dd></div>
            <div><dt className="text-zinc-500">Documento</dt><dd className="mt-1 font-semibold">{cliente.facturacion_tipo_documento} {cliente.facturacion_numero_documento}{cliente.facturacion_dv ? `-${cliente.facturacion_dv}` : ""}</dd></div>
            <div><dt className="text-zinc-500">Correo</dt><dd className="mt-1 break-all font-semibold">{cliente.facturacion_correo}</dd></div>
            <div><dt className="text-zinc-500">Ubicación</dt><dd className="mt-1 font-semibold">{cliente.facturacion_ciudad}, {cliente.facturacion_departamento}</dd></div>
            <div className="sm:col-span-2"><dt className="text-zinc-500">Dirección</dt><dd className="mt-1 font-semibold">{cliente.facturacion_direccion}</dd></div>
          </dl>
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-black">Direcciones utilizadas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {direcciones.map((direccion, indice) => <div key={direccion} className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300"><span className="mr-2 font-black text-lime-400">{indice + 1}.</span>{direccion}</div>)}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-800">
        <div className="bg-zinc-900 px-6 py-4"><h2 className="text-lg font-black">Historial de pedidos</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Pedido</th><th className="px-5 py-4">Pago</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4 text-right">Acción</th></tr></thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950">
              {pedidos.map((pedido) => <tr key={pedido.id} className="hover:bg-zinc-900/70"><td className="px-5 py-4 text-zinc-400">{new Date(pedido.creado_en).toLocaleString("es-CO")}</td><td className="px-5 py-4 font-bold text-lime-400">{pedido.numero_pedido}</td><td className="px-5 py-4 text-zinc-300">{estadoTexto(pedido.estado_pago)}</td><td className="px-5 py-4 text-zinc-300">{estadoTexto(pedido.estado_pedido)}</td><td className="px-5 py-4 text-right font-black">{dinero.format(Number(pedido.total))}</td><td className="px-5 py-4 text-right"><Link href={`/admin/pedidos/${pedido.id}`} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold hover:border-lime-400 hover:text-lime-300">Ver pedido</Link></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
