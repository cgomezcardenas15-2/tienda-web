import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import EstadoPedidoControl from "./EstadoPedidoControl";
import EnvioPedidoForm from "./EnvioPedidoForm";
import NotificacionEnvioControl from "./NotificacionEnvioControl";

export const dynamic = "force-dynamic";

const dinero = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function imagenValida(valor: unknown) {
  if (typeof valor !== "string") return null;
  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [{ data: pedido, error }, { data: productos, error: productosError }] = await Promise.all([
    supabaseAdmin.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("productos_pedido").select("*").eq("pedido_id", id),
  ]);

  if (error || !pedido) notFound();

  if (productosError) {
    console.error("Error cargando productos del pedido:", {
      code: productosError.code,
      message: productosError.message,
    });
  }

  const productosIds = [...new Set((productos || []).map((producto) => producto.producto_id).filter(Boolean))];
  const { data: catalogo, error: catalogoError } = productosIds.length
    ? await supabaseAdmin.from("productos").select("id,sku,imagen_url").in("id", productosIds)
    : { data: [], error: null };

  if (catalogoError) {
    console.error("Error cargando imágenes del catálogo:", {
      code: catalogoError.code,
      message: catalogoError.message,
    });
  }

  const catalogoPorId = new Map((catalogo || []).map((producto) => [String(producto.id), producto]));

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/admin/pedidos" className="text-sm font-bold text-lime-400 hover:text-lime-300">← Volver a pedidos</Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">DETALLE DEL PEDIDO</p><h1 className="mt-2 text-3xl font-black">{pedido.comprador_nombre}</h1><p className="mt-2 text-sm font-bold text-lime-400">{pedido.numero_pedido}</p></div>
        <p className="text-3xl font-black text-lime-400">{dinero.format(Number(pedido.total))}</p>
      </div>

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Cliente</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-zinc-500">Correo</dt><dd className="mt-1">{pedido.comprador_correo}</dd></div><div><dt className="text-zinc-500">Teléfono</dt><dd className="mt-1">{pedido.comprador_telefono}</dd></div><div><dt className="text-zinc-500">Documento</dt><dd className="mt-1">{pedido.comprador_tipo_documento} {pedido.comprador_numero_documento}</dd></div></dl></article>
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Entrega</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-zinc-500">Destino</dt><dd className="mt-1">{pedido.entrega_ciudad}, {pedido.entrega_departamento}</dd></div><div><dt className="text-zinc-500">Dirección</dt><dd className="mt-1">{pedido.entrega_direccion}{pedido.entrega_complemento ? `, ${pedido.entrega_complemento}` : ""}</dd></div><div><dt className="text-zinc-500">Instrucciones</dt><dd className="mt-1">{pedido.entrega_instrucciones || "Sin instrucciones"}</dd></div></dl></article>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-zinc-500">Estado del pago</p><p className="mt-1 font-black text-lime-400">{pedido.estado_pago}</p></div><div><p className="text-sm text-zinc-500">Estado del pedido</p><p className="mt-1 font-black">{pedido.estado_pedido}</p></div><div><p className="text-sm text-zinc-500">Proveedor</p><p className="mt-1 font-black">{pedido.proveedor_pago || "—"}</p></div></div></section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">Gestión del pedido</p>
        <h2 className="mt-2 text-xl font-black">Siguiente paso</h2>
        <div className="mt-4"><EstadoPedidoControl pedidoId={pedido.id} estadoActual={pedido.estado_pedido} pagoAprobado={pedido.estado_pago === "aprobado"} /></div>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">Logística</p>
        <h2 className="mt-2 text-xl font-black">Información de envío</h2>
        <p className="mt-2 text-sm text-zinc-400">Guarda la guía antes de marcar el pedido como enviado.</p>
        <EnvioPedidoForm pedidoId={pedido.id} estadoPedido={pedido.estado_pedido} inicial={{ transportadora: pedido.envio_transportadora || "", servicio: pedido.envio_servicio || "", numeroGuia: pedido.envio_numero_guia || "", urlSeguimiento: pedido.envio_url_seguimiento || "" }} />
        <NotificacionEnvioControl pedidoId={pedido.id} estadoPedido={pedido.estado_pedido} notificadoEn={pedido.envio_notificado_email_en || null} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-800">
        <div className="bg-zinc-900 px-6 py-4"><h2 className="font-black">Productos</h2></div>
        <div className="divide-y divide-zinc-800">
          {productosError ? <p className="bg-red-950/30 px-6 py-5 text-sm text-red-300">No fue posible cargar los productos de este pedido.</p> : productos?.length ? productos.map((producto) => {
            const productoCatalogo = catalogoPorId.get(String(producto.producto_id));
            const imagen = imagenValida(producto.variante_imagen_url) || imagenValida(productoCatalogo?.imagen_url);
            const cantidad = Number(producto.cantidad);
            const precioUnitario = Number(producto.precio_unitario);

            return (
              <article key={producto.id} className="grid gap-4 bg-zinc-950 px-6 py-5 sm:grid-cols-[88px_1fr_auto] sm:items-center">
                {imagen ? <div role="img" aria-label={`Imagen de ${producto.nombre}`} className="h-[88px] w-[88px] rounded-xl border border-zinc-800 bg-white bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(imagen)})` }} /> : <div className="flex h-[88px] w-[88px] items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-2 text-center text-xs font-semibold text-zinc-500">Sin imagen</div>}
                <div>
                  <p className="font-bold text-white">{producto.nombre}</p>
                  {producto.variante_nombre ? <p className="mt-1 font-semibold text-lime-400">{producto.variante_nombre}</p> : null}
                  {producto.variante_sku || productoCatalogo?.sku ? <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">SKU: {producto.variante_sku || productoCatalogo?.sku}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-400"><span>Cantidad: <strong className="text-zinc-200">{cantidad}</strong></span><span>Precio unitario: <strong className="text-zinc-200">{dinero.format(precioUnitario)}</strong></span></div>
                </div>
                <div className="sm:text-right"><p className="text-xs uppercase tracking-wide text-zinc-500">Total</p><p className="mt-1 text-lg font-black text-lime-400">{dinero.format(precioUnitario * cantidad)}</p></div>
              </article>
            );
          }) : <p className="bg-zinc-950 px-6 py-5 text-sm text-zinc-400">Este pedido no tiene productos registrados.</p>}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Resumen</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd>{dinero.format(Number(pedido.subtotal))}</dd></div><div className="flex justify-between"><dt className="text-zinc-500">Envío</dt><dd>{dinero.format(Number(pedido.costo_envio))}</dd></div><div className="flex justify-between"><dt className="text-zinc-500">Descuento</dt><dd>{dinero.format(Number(pedido.descuento))}</dd></div><div className="flex justify-between border-t border-zinc-700 pt-3 text-lg font-black"><dt>Total</dt><dd>{dinero.format(Number(pedido.total))}</dd></div></dl></section>
    </main>
  );
}
