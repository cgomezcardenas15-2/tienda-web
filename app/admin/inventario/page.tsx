import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function tipoVisual(tipo: string, diferencia: number) {
  if (tipo === "inventario_inicial") return { texto: "Inventario inicial", clase: "bg-blue-500/15 text-blue-300" };
  if (diferencia > 0) return { texto: "Entrada", clase: "bg-lime-400/15 text-lime-300" };
  return { texto: "Salida", clase: "bg-orange-500/15 text-orange-300" };
}

export default async function InventarioPage() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from("movimientos_inventario")
    .select("id,producto_nombre,variante_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia,creado_en")
    .order("creado_en", { ascending: false }).limit(200);
  const movimientos = data ?? [];
  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">CONTROL</p><h1 className="mt-2 text-3xl font-black">Historial de inventario</h1><p className="mt-2 text-sm text-zinc-400">Últimos 200 cambios registrados automáticamente desde la activación del historial.</p></div><a href="/api/admin/exportar/movimientos" download className="rounded-xl border border-lime-400/40 px-4 py-2 text-sm font-bold text-lime-300 hover:bg-lime-400/10">Descargar historial CSV</a></div>
    {error ? <p className="mt-7 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">No fue posible cargar el historial.</p> : movimientos.length===0 ? <p className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Todavía no se han registrado cambios de existencias.</p> : <div className="mt-7 overflow-x-auto rounded-2xl border border-zinc-800"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Producto</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Movimiento</th><th className="px-5 py-4 text-right">Anterior</th><th className="px-5 py-4 text-right">Cambio</th><th className="px-5 py-4 text-right">Nuevo</th></tr></thead><tbody className="divide-y divide-zinc-800 bg-zinc-950">{movimientos.map((movimiento)=>{const visual=tipoVisual(movimiento.tipo,Number(movimiento.diferencia));return <tr key={movimiento.id} className="hover:bg-zinc-900/70"><td className="px-5 py-4 text-zinc-400">{new Date(movimiento.creado_en).toLocaleString("es-CO")}</td><td className="px-5 py-4"><p className="font-bold">{movimiento.producto_nombre}</p>{movimiento.variante_nombre&&<p className="mt-1 text-xs text-lime-400">{movimiento.variante_nombre}</p>}</td><td className="px-5 py-4 text-zinc-400">{movimiento.sku||"—"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${visual.clase}`}>{visual.texto}</span></td><td className="px-5 py-4 text-right">{movimiento.cantidad_anterior}</td><td className={`px-5 py-4 text-right font-black ${Number(movimiento.diferencia)>0?"text-lime-300":"text-orange-300"}`}>{Number(movimiento.diferencia)>0?"+":""}{movimiento.diferencia}</td><td className="px-5 py-4 text-right font-black">{movimiento.cantidad_nueva}</td></tr>})}</tbody></table></div>}
  </main>;
}
