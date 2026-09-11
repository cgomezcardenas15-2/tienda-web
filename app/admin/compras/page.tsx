import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import ProveedorForm from "./ProveedorForm";

export const dynamic = "force-dynamic";

type Proveedor = { id: string; nombre: string; tipo_documento: string; numero_documento?: string; persona_contacto?: string; correo?: string; telefono?: string; pais: string; ciudad?: string; moneda: string; activo: boolean };

export default async function ComprasPage() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from("proveedores").select("*").order("nombre").limit(500);
  const proveedores = (data || []) as Proveedor[];
  const sinPreparar = error?.code === "42P01" || error?.message?.includes("schema cache");

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">ABASTECIMIENTO</p><h1 className="mt-2 text-3xl font-black">Compras y proveedores</h1><p className="mt-2 text-sm text-zinc-400">Controla quién suministra la mercancía y conserva sus datos comerciales.</p></div>
      {sinPreparar ? <div className="mt-7 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200"><p className="font-black">Falta preparar esta sección</p><p className="mt-2 text-sm">Ejecuta el archivo proveedores_compras.sql en Supabase una sola vez.</p></div> : null}
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">NUEVO PROVEEDOR</p><h2 className="mt-2 text-xl font-black">Datos comerciales</h2><ProveedorForm /></section>
        <section className="overflow-hidden rounded-2xl border border-zinc-800"><div className="bg-zinc-900 px-6 py-5"><h2 className="text-xl font-black">Proveedores registrados</h2><p className="mt-1 text-sm text-zinc-400">{proveedores.length} en total</p></div>{error && !sinPreparar ? <p className="bg-red-950/30 p-6 text-red-300">No fue posible cargar los proveedores.</p> : proveedores.length === 0 ? <p className="bg-zinc-950 p-8 text-center text-zinc-400">Todavía no hay proveedores registrados.</p> : <div className="divide-y divide-zinc-800 bg-zinc-950">{proveedores.map((proveedor) => <article key={proveedor.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-black">{proveedor.nombre}</h3><p className="mt-1 text-sm text-zinc-400">{proveedor.tipo_documento} {proveedor.numero_documento || "Sin número"}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${proveedor.activo ? "bg-lime-400/15 text-lime-300" : "bg-zinc-800 text-zinc-400"}`}>{proveedor.activo ? "Activo" : "Inactivo"}</span></div><div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2"><p>{proveedor.persona_contacto || "Sin contacto"}</p><p>{proveedor.telefono || "Sin teléfono"}</p><p>{proveedor.correo || "Sin correo"}</p><p>{[proveedor.ciudad, proveedor.pais].filter(Boolean).join(", ")} · {proveedor.moneda}</p></div></article>)}</div>}</section>
      </div>
    </main>
  );
}
