import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import ImprimirRemision from "./ImprimirRemision";

export const dynamic = "force-dynamic";

const dinero = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" });

function texto(valor: unknown, alternativa = "—") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : alternativa;
}

export default async function RemisionPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [{ data: pedido, error }, { data: productos, error: productosError }] = await Promise.all([
    supabaseAdmin.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("productos_pedido").select("*").eq("pedido_id", id).order("id"),
  ]);

  if (error || !pedido) notFound();

  const nombreCliente = texto(pedido.facturacion_razon_social || pedido.facturacion_nombre || pedido.comprador_razon_social || pedido.comprador_nombre);

  return (
    <main className="min-h-screen bg-[#080a09] px-4 py-8 text-zinc-950 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/pedidos/${pedido.id}`} className="font-bold text-[#89f000] hover:text-lime-300">← Volver al pedido</Link>
        <ImprimirRemision pedidoId={pedido.id} />
      </div>

      <article className="mx-auto max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
        <header className="relative overflow-hidden border-b-2 border-zinc-200 bg-white px-7 py-8 text-zinc-950 sm:px-10">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[48px] border-[#89f000]/10 print:hidden" />
          <div className="relative flex flex-wrap items-start justify-between gap-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#89f000] text-lg font-black text-black">N</span>
              <div><p className="text-2xl font-black tracking-[0.24em]">NOVA</p><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime-700">Todo lo que necesitas</p></div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-flex rounded-full bg-[#89f000] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">Remisión</span>
              <h1 className="mt-3 text-2xl font-black tracking-tight">REM-{pedido.numero_pedido}</h1>
              <p className="mt-1 text-xs text-zinc-500">Emitida el {fecha.format(new Date(pedido.creado_en))}</p>
            </div>
          </div>
        </header>

        <div className="p-7 sm:p-10">
          <section className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Cliente</p>
              <p className="mt-2 text-xl font-black text-zinc-950">{nombreCliente}</p>
              <p className="mt-2 text-sm text-zinc-600">{texto(pedido.facturacion_tipo_documento || pedido.comprador_tipo_documento)} {texto(pedido.facturacion_numero_documento || pedido.comprador_numero_documento)}</p>
              <p className="mt-1 text-sm text-zinc-600">{texto(pedido.facturacion_correo || pedido.comprador_correo)}</p>
              <p className="mt-1 text-sm text-zinc-600">{texto(pedido.comprador_telefono)}</p>
            </div>
            <div className="rounded-2xl bg-[#e9fbd0] p-5 ring-1 ring-[#89f000]/40">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-800">Pedido</p>
              <p className="mt-2 text-xl font-black">{pedido.numero_pedido}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase">
                <span className="rounded-full bg-white px-3 py-1.5 text-lime-800">Pago {texto(pedido.estado_pago)}</span>
                <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-white">{texto(pedido.estado_pedido)}</span>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Entregar en</p>
            <p className="mt-2 font-black">{texto(pedido.entrega_direccion)}{pedido.entrega_complemento ? `, ${pedido.entrega_complemento}` : ""}</p>
            <p className="mt-1 text-sm text-zinc-600">{texto(pedido.entrega_ciudad)}, {texto(pedido.entrega_departamento)}</p>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-zinc-100 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                <tr><th className="px-5 py-4 text-left">Producto</th><th className="px-3 py-4 text-center">Cant.</th><th className="px-3 py-4 text-right">Unitario</th><th className="px-5 py-4 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {productosError ? <tr><td colSpan={4} className="px-5 py-5 text-center text-red-700">No fue posible cargar los productos.</td></tr> : productos?.length ? productos.map((producto) => {
                  const cantidad = Number(producto.cantidad);
                  const precio = Number(producto.precio_unitario);
                  return (
                    <tr key={producto.id}>
                      <td className="px-5 py-5"><strong className="text-zinc-950">{producto.nombre}</strong>{producto.variante_nombre ? <span className="mt-1 block text-xs font-semibold text-lime-700">{producto.variante_nombre}</span> : null}{producto.variante_sku ? <span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-400">SKU {producto.variante_sku}</span> : null}</td>
                      <td className="px-3 py-5 text-center font-bold">{cantidad}</td>
                      <td className="px-3 py-5 text-right">{dinero.format(precio)}</td>
                      <td className="px-5 py-5 text-right font-black">{dinero.format(precio * cantidad)}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} className="px-5 py-5 text-center">Sin productos registrados.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="mt-6 grid items-end gap-6 sm:grid-cols-[1fr_340px]">
            <div className="text-sm text-zinc-500"><p>Gracias por elegir NOVA.</p><p className="mt-1">Atención directa · Compra sencilla</p></div>
            <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-5 text-zinc-950">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-8 text-zinc-500"><dt>Subtotal</dt><dd className="text-zinc-950">{dinero.format(Number(pedido.subtotal))}</dd></div>
                <div className="flex justify-between gap-8 text-zinc-500"><dt>Envío</dt><dd className="text-zinc-950">{dinero.format(Number(pedido.costo_envio))}</dd></div>
                <div className="flex justify-between gap-8 text-zinc-500"><dt>Descuento</dt><dd className="text-zinc-950">-{dinero.format(Number(pedido.descuento))}</dd></div>
                <div className="mt-3 flex justify-between gap-8 border-t-2 border-zinc-950 pt-4 text-xl font-black"><dt>Total</dt><dd className="text-lime-700">{dinero.format(Number(pedido.total))}</dd></div>
              </dl>
            </div>
          </section>

          <footer className="mt-12">
            <div className="grid gap-10 text-center text-[11px] text-zinc-500 sm:grid-cols-2"><div className="border-t border-zinc-400 pt-2">Preparado por NOVA</div><div className="border-t border-zinc-400 pt-2">Nombre y firma de recibido</div></div>
            <p className="mt-8 text-center text-[9px] uppercase tracking-[0.16em] text-zinc-400">Remisión comercial · Documento no fiscal</p>
          </footer>
        </div>
      </article>
    </main>
  );
}
