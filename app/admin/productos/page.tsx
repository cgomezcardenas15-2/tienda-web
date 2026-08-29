import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function ProductosAdminPage() {
  await requireAdmin();
  const [{ data: productos, error }, { data: variantes }] = await Promise.all([
    supabaseAdmin.from("productos").select("id,nombre,sku,stock,activo,imagen_url,categoria,precio,en_oferta").order("nombre"),
    supabaseAdmin.from("variantes_producto").select("producto_id,id,activo"),
  ]);
  const conteo = new Map<string, number>();
  for (const variante of variantes ?? []) conteo.set(variante.producto_id, (conteo.get(variante.producto_id) ?? 0) + 1);

  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">CATÁLOGO</p><h1 className="mt-2 text-3xl font-black">Productos y variantes</h1><p className="mt-2 text-sm text-zinc-400">Elige cuáles productos tendrán colores, tallas u otras opciones.</p></div>
      <div className="flex gap-3"><Link href="/admin/pedidos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Ver pedidos</Link><Link href="/admin/productos/nuevo" className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-black hover:bg-lime-300">+ Nuevo producto</Link></div>
    </div>
    {error ? <p className="mt-7 rounded-xl bg-red-950 p-5 text-red-300">No fue posible cargar los productos.</p> :
      <div className="mt-7 grid gap-4 md:grid-cols-2">{(productos ?? []).map((producto) =>
        <article key={producto.id} className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {producto.imagen_url ? <div className="h-16 w-16 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${JSON.stringify(producto.imagen_url)})`}} /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800">📦</div>}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-black">{producto.nombre}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-black ${producto.activo ? "bg-lime-400/15 text-lime-300" : "bg-amber-400/15 text-amber-300"}`}>{producto.activo ? "VISIBLE" : "SUSPENDIDO"}</span>{producto.en_oferta && <span className="rounded-full bg-orange-400/15 px-2 py-1 text-[10px] font-black text-orange-300">OFERTA</span>}</div><p className="mt-1 text-xs text-zinc-500">{producto.categoria} · SKU: {producto.sku || "Sin SKU"} · Stock: {producto.stock} · ${Number(producto.precio).toLocaleString("es-CO")}</p><p className="mt-2 text-sm font-bold text-lime-400">{conteo.get(producto.id) ?? 0} variantes</p></div>
          <Link href={`/admin/productos/${producto.id}`} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-black hover:bg-lime-300">Administrar</Link>
        </article>)}
      </div>}
  </main>;
}
