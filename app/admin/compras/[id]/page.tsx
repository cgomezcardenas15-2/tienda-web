import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import EstadoCompra from "./EstadoCompra";
import VincularLinea from "./VincularLinea";

export const dynamic = "force-dynamic";

type Linea = { id: string; descripcion: string; sku: string | null; cantidad: number; costo_unitario: number; subtotal: number; producto_id: string | null; variante_id: string | null };

export default async function CompraPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params;
  const { data: compra, error } = await supabaseAdmin.from("compras").select("*, proveedores(id,nombre)").eq("id", id).maybeSingle();
  if (error || !compra) notFound();
  const { data } = await supabaseAdmin.from("productos_compra").select("*").eq("compra_id", id).order("descripcion");
  const lineas = (data || []) as Linea[];
  const [{ data: productos }, { data: variantes }] = await Promise.all([
    supabaseAdmin.from("productos").select("id,nombre,sku,activo").eq("activo", true).order("nombre"),
    supabaseAdmin.from("variantes_producto").select("id,producto_id,nombre,sku,activo").eq("activo", true).order("nombre"),
  ]);
  const variantesPorProducto = new Map<string, NonNullable<typeof variantes>>();
  for (const variante of variantes || []) variantesPorProducto.set(variante.producto_id, [...(variantesPorProducto.get(variante.producto_id) || []), variante]);
  const opciones = (productos || []).flatMap(producto => {
    const opcionesVariantes = variantesPorProducto.get(producto.id) || [];
    return opcionesVariantes.length ? opcionesVariantes.map(variante => ({ valor: `${producto.id}|${variante.id}`, etiqueta: `${producto.nombre} · ${variante.nombre}${variante.sku ? ` (${variante.sku})` : ""}` })) : [{ valor: `${producto.id}|`, etiqueta: `${producto.nombre}${producto.sku ? ` (${producto.sku})` : ""}` }];
  });
  const puedeRecibir = lineas.length > 0 && lineas.every(linea => Boolean(linea.producto_id));
  const proveedor = Array.isArray(compra.proveedores) ? compra.proveedores[0] : compra.proveedores;

  return <main className="mx-auto max-w-5xl px-5 py-8">
    <Link href={`/admin/compras/proveedores/${proveedor.id}`} className="font-black text-lime-400">← Volver al proveedor</Link>
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">DETALLE DE COMPRA</p><h1 className="mt-2 text-3xl font-black">NOVA-{String(compra.consecutivo).padStart(5, "0")}</h1><p className="mt-2 text-zinc-400">{proveedor.nombre}</p></div><span className="h-fit rounded-full bg-amber-500/15 px-4 py-2 text-sm font-black uppercase text-amber-300">{compra.estado}</span></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3"><div><p className="text-xs uppercase text-zinc-500">Factura</p><p className="mt-1 font-bold">{compra.factura_proveedor || "Sin número"}</p></div><div><p className="text-xs uppercase text-zinc-500">Fecha</p><p className="mt-1 font-bold">{compra.fecha_compra}</p></div><div><p className="text-xs uppercase text-zinc-500">Total</p><p className="mt-1 text-xl font-black text-lime-300">{compra.moneda} {Number(compra.total).toLocaleString("es-CO")}</p></div></div>
      <EstadoCompra compraId={compra.id} estado={compra.estado} puedeRecibir={puedeRecibir} />
    </section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800"><div className="bg-zinc-900 p-6"><h2 className="text-xl font-black">Productos comprados</h2><p className="mt-1 text-sm text-zinc-400">Vincula cada línea con el producto exacto del inventario.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-zinc-950 text-xs uppercase text-zinc-500"><tr><th className="p-4">Producto</th><th className="p-4">SKU</th><th className="p-4">Producto del inventario</th><th className="p-4 text-right">Cantidad</th><th className="p-4 text-right">Costo unitario</th><th className="p-4 text-right">Subtotal</th></tr></thead><tbody className="divide-y divide-zinc-800 bg-black">{lineas.map(linea => <tr key={linea.id}><td className="p-4 font-bold">{linea.descripcion}</td><td className="p-4 text-zinc-400">{linea.sku || "—"}</td><td className="p-4"><VincularLinea compraId={compra.id} lineaId={linea.id} opciones={opciones} valorActual={linea.producto_id ? `${linea.producto_id}|${linea.variante_id || ""}` : ""} bloqueado={["recibida", "anulada"].includes(compra.estado)} /></td><td className="p-4 text-right">{linea.cantidad}</td><td className="p-4 text-right">{compra.moneda} {Number(linea.costo_unitario).toLocaleString("es-CO")}</td><td className="p-4 text-right font-black">{compra.moneda} {Number(linea.subtotal).toLocaleString("es-CO")}</td></tr>)}</tbody></table></div>
      <div className="grid gap-3 bg-zinc-950 p-6 text-sm sm:grid-cols-4"><p>Subtotal: <b>{Number(compra.subtotal).toLocaleString("es-CO")}</b></p><p>Impuestos: <b>{Number(compra.impuestos).toLocaleString("es-CO")}</b></p><p>Envío y otros: <b>{(Number(compra.costo_envio) + Number(compra.otros_costos)).toLocaleString("es-CO")}</b></p><p>Total: <b className="text-lime-300">{Number(compra.total).toLocaleString("es-CO")}</b></p></div>
    </section>
  </main>;
}
