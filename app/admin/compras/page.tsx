import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import Link from "next/link";
import ProveedorForm from "./ProveedorForm";

export const dynamic = "force-dynamic";

type Proveedor = { id: string; nombre: string; tipo_documento: string; numero_documento?: string; persona_contacto?: string; correo?: string; telefono?: string; pais: string; ciudad?: string; moneda: string; activo: boolean };
type Compra = { id: string; consecutivo: number; fecha_compra: string; estado: "borrador" | "ordenada" | "recibida" | "anulada"; moneda: string; total: number; proveedores: { nombre: string } | { nombre: string }[] | null };

export default async function ComprasPage() {
  await requireAdmin();
  const [{ data, error }, { data: datosCompras, error: errorCompras }] = await Promise.all([
    supabaseAdmin.from("proveedores").select("*").order("nombre").limit(500),
    supabaseAdmin.from("compras").select("id,consecutivo,fecha_compra,estado,moneda,total,proveedores(nombre)").order("creado_en", { ascending: false }).limit(300),
  ]);
  const proveedores = (data || []) as Proveedor[];
  const compras = (datosCompras || []) as Compra[];
  const sinPreparar = error?.code === "42P01" || error?.message?.includes("schema cache");
  const conteo = (estado: Compra["estado"]) => compras.filter(compra => compra.estado === estado).length;
  const totalRecibidoCop = compras.filter(compra => compra.estado === "recibida" && compra.moneda === "COP").reduce((total, compra) => total + Number(compra.total), 0);
  const nombreProveedor = (compra: Compra) => Array.isArray(compra.proveedores) ? compra.proveedores[0]?.nombre : compra.proveedores?.nombre;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">ABASTECIMIENTO</p><h1 className="mt-2 text-3xl font-black">Compras y proveedores</h1><p className="mt-2 text-sm text-zinc-400">Controla quién suministra la mercancía y conserva sus datos comerciales.</p></div>
      {sinPreparar ? <div className="mt-7 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200"><p className="font-black">Falta preparar esta sección</p><p className="mt-2 text-sm">Ejecuta el archivo proveedores_compras.sql en Supabase una sola vez.</p></div> : null}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Borradores</p><p className="mt-2 text-3xl font-black">{conteo("borrador")}</p></div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5"><p className="text-sm text-amber-200">Ordenadas</p><p className="mt-2 text-3xl font-black text-amber-300">{conteo("ordenada")}</p></div>
        <div className="rounded-2xl border border-lime-500/25 bg-lime-500/5 p-5"><p className="text-sm text-lime-200">Recibidas</p><p className="mt-2 text-3xl font-black text-lime-300">{conteo("recibida")}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Compras recibidas en COP</p><p className="mt-2 text-2xl font-black text-lime-300">$ {totalRecibidoCop.toLocaleString("es-CO")}</p></div>
      </section>
      <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800"><div className="flex flex-wrap items-end justify-between gap-3 bg-zinc-900 px-6 py-5"><div><h2 className="text-xl font-black">Compras recientes</h2><p className="mt-1 text-sm text-zinc-400">Seguimiento general de abastecimiento.</p></div><p className="text-sm font-bold text-zinc-400">{compras.length} registradas</p></div>{errorCompras ? <p className="bg-red-950/30 p-6 text-red-300">No fue posible cargar las compras.</p> : compras.length === 0 ? <p className="bg-zinc-950 p-7 text-zinc-400">Todavía no hay compras registradas.</p> : <div className="divide-y divide-zinc-800 bg-zinc-950">{compras.slice(0, 8).map(compra => <article key={compra.id} className="flex flex-wrap items-center gap-4 p-5"><div><p className="font-black">NOVA-{String(compra.consecutivo).padStart(5, "0")}</p><p className="mt-1 text-sm text-zinc-400">{nombreProveedor(compra) || "Proveedor"} · {compra.fecha_compra}</p></div><span className={`ml-auto rounded-full px-3 py-1 text-xs font-black uppercase ${compra.estado === "recibida" ? "bg-lime-400/15 text-lime-300" : compra.estado === "ordenada" ? "bg-amber-500/15 text-amber-300" : compra.estado === "anulada" ? "bg-red-500/15 text-red-300" : "bg-zinc-800 text-zinc-300"}`}>{compra.estado}</span><p className="min-w-32 text-right font-black">{compra.moneda} {Number(compra.total).toLocaleString("es-CO")}</p><Link href={`/admin/compras/${compra.id}`} className="inline-flex min-h-10 items-center rounded-xl border border-lime-400/60 px-4 text-sm font-black text-lime-300">Ver compra</Link></article>)}</div>}</section>
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">NUEVO PROVEEDOR</p><h2 className="mt-2 text-xl font-black">Datos comerciales</h2><ProveedorForm /></section>
        <section className="overflow-hidden rounded-2xl border border-zinc-800"><div className="bg-zinc-900 px-6 py-5"><h2 className="text-xl font-black">Proveedores registrados</h2><p className="mt-1 text-sm text-zinc-400">{proveedores.length} en total</p></div>{error && !sinPreparar ? <p className="bg-red-950/30 p-6 text-red-300">No fue posible cargar los proveedores.</p> : proveedores.length === 0 ? <p className="bg-zinc-950 p-8 text-center text-zinc-400">Todavía no hay proveedores registrados.</p> : <div className="divide-y divide-zinc-800 bg-zinc-950">{proveedores.map((proveedor) => <article key={proveedor.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-black">{proveedor.nombre}</h3><p className="mt-1 text-sm text-zinc-400">{proveedor.tipo_documento} {proveedor.numero_documento || "Sin número"}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${proveedor.activo ? "bg-lime-400/15 text-lime-300" : "bg-zinc-800 text-zinc-400"}`}>{proveedor.activo ? "Activo" : "Suspendido"}</span></div><div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2"><p>{proveedor.persona_contacto || "Sin contacto"}</p><p>{proveedor.telefono || "Sin teléfono"}</p><p>{proveedor.correo || "Sin correo"}</p><p>{[proveedor.ciudad, proveedor.pais].filter(Boolean).join(", ")} · {proveedor.moneda}</p></div><Link href={`/admin/compras/proveedores/${proveedor.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-lime-400/60 px-5 font-black text-lime-300 transition hover:bg-lime-400 hover:text-black">Ver proveedor</Link></article>)}</div>}</section>
      </div>
    </main>
  );
}
