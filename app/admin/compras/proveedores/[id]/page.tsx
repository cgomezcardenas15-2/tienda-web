import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import ProveedorEditor from "./ProveedorEditor";
import CompraForm from "./CompraForm";

export const dynamic = "force-dynamic";

export default async function ProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data: proveedor, error } = await supabaseAdmin.from("proveedores").select("*").eq("id", id).maybeSingle();
  if (error || !proveedor) notFound();
  const { data: compras } = await supabaseAdmin.from("compras").select("id, consecutivo, factura_proveedor, fecha_compra, estado, moneda, total").eq("proveedor_id", id).order("creado_en", { ascending: false }).limit(100);

  return <main className="mx-auto max-w-4xl px-5 py-8">
    <Link href="/admin/compras" className="font-black text-lime-400">← Volver a compras y proveedores</Link>
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">FICHA DEL PROVEEDOR</p><h1 className="mt-2 text-3xl font-black">{proveedor.nombre}</h1></div><span className={`rounded-full px-4 py-2 text-sm font-black ${proveedor.activo ? "bg-lime-400/15 text-lime-300" : "bg-amber-500/15 text-amber-300"}`}>{proveedor.activo ? "Activo" : "Suspendido"}</span></div>
      <ProveedorEditor proveedor={proveedor} />
    </div>
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">NUEVA COMPRA</p><h2 className="mt-2 text-2xl font-black">Registrar compra</h2><p className="mt-2 text-sm text-zinc-400">Se guardará como borrador y todavía no cambiará el inventario.</p>
      {proveedor.activo ? <CompraForm proveedorId={proveedor.id} moneda={proveedor.moneda} /> : <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">Reactiva este proveedor para registrar una compra nueva.</p>}
    </section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800"><div className="bg-zinc-900 p-6"><h2 className="text-xl font-black">Compras de este proveedor</h2><p className="mt-1 text-sm text-zinc-400">{compras?.length || 0} registradas</p></div>{!compras?.length ? <p className="bg-zinc-950 p-7 text-zinc-400">Todavía no hay compras.</p> : <div className="divide-y divide-zinc-800 bg-zinc-950">{compras.map(compra => <article key={compra.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-black">NOVA-{String(compra.consecutivo).padStart(5, "0")}</p><p className="mt-1 text-sm text-zinc-400">{compra.fecha_compra} · {compra.factura_proveedor || "Sin número de factura"}</p></div><div className="ml-auto text-right"><p className="font-black">{compra.moneda} {Number(compra.total).toLocaleString("es-CO")}</p><p className="mt-1 text-xs font-bold uppercase text-amber-300">{compra.estado}</p></div><Link href={`/admin/compras/${compra.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-lime-400/60 px-4 font-black text-lime-300">Ver compra</Link></article>)}</div>}</section>
  </main>;
}
