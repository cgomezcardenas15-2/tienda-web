import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { consultarTodosSupabase } from "@/app/lib/consultarTodosSupabase";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const PRODUCTOS_POR_PAGINA = 50;

type ProductosAdminPageProps = {
  searchParams: Promise<{
    pagina?: string | string[];
  }>;
};

function obtenerPagina(valor: string | string[] | undefined) {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number.parseInt(texto ?? "1", 10);

  return Number.isSafeInteger(numero) && numero > 0
    ? Math.min(numero, 1_000_000)
    : 1;
}

export default async function ProductosAdminPage({
  searchParams,
}: ProductosAdminPageProps) {
  await requireAdmin();
  const { pagina: paginaParametro } = await searchParams;
  const paginaSolicitada = obtenerPagina(paginaParametro);

  const [resultadoConteo, resultadoVisibles, productosResumen, variantesResumen] = await Promise.all([
    supabaseAdmin
      .from("productos")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("activo", true),
    consultarTodosSupabase((desde, hasta) => supabaseAdmin
      .from("productos")
      .select("id,stock", { count: "exact" })
      .order("id")
      .range(desde, hasta)),
    consultarTodosSupabase((desde, hasta) => supabaseAdmin
      .from("variantes_producto")
      .select("id,producto_id,activo,stock,controla_stock", { count: "exact" })
      .order("producto_id")
      .order("id")
      .range(desde, hasta)),
  ]);

  const totalProductos = resultadoConteo.count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil((totalProductos ?? 0) / PRODUCTOS_POR_PAGINA));

  if (!resultadoConteo.error && totalProductos > 0 && paginaSolicitada > totalPaginas) {
    redirect(`/admin/productos?pagina=${totalPaginas}`);
  }

  const paginaActual = Math.min(paginaSolicitada, totalPaginas);
  const desde = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const hasta = desde + PRODUCTOS_POR_PAGINA - 1;
  const resultadoProductos = await supabaseAdmin
    .from("productos")
    .select("id,nombre,sku,stock,activo,imagen_url,categoria,precio,en_oferta")
    .order("nombre")
    .order("id")
    .range(desde, hasta);
  const productos = resultadoProductos.data ?? [];

  const productosIds = productos.map((producto) => producto.id);
  const resultadoVariantes = productosIds.length > 0
    ? await consultarTodosSupabase((desdeVariantes, hastaVariantes) => supabaseAdmin
        .from("variantes_producto")
        .select("producto_id,id,activo,stock,controla_stock", { count: "exact" })
        .in("producto_id", productosIds)
        .order("producto_id")
        .order("id")
        .range(desdeVariantes, hastaVariantes))
    : { data: [], error: null, count: 0 };
  const variantes = resultadoVariantes.data ?? [];
  const error = resultadoConteo.error ?? resultadoProductos.error ?? resultadoVariantes.error;

  const conteo = new Map<string, number>();
  for (const variante of variantes) conteo.set(variante.producto_id, (conteo.get(variante.producto_id) ?? 0) + 1);
  const variantesPorProducto = new Map<string, typeof variantes>();
  for (const variante of variantes) {
    const actuales = variantesPorProducto.get(variante.producto_id) ?? [];
    actuales.push(variante);
    variantesPorProducto.set(variante.producto_id, actuales);
  }
  const stockPorColores = new Map<string, number>();
  for (const [productoId, opciones] of variantesPorProducto) {
    stockPorColores.set(
      productoId,
      (opciones ?? []).reduce((total, variante) => total + (variante.controla_stock ? Number(variante.stock) : 0), 0),
    );
  }
  const variantesResumenPorProducto = new Map<string, NonNullable<typeof variantesResumen.data>>();
  for (const variante of variantesResumen.data ?? []) {
    const actuales = variantesResumenPorProducto.get(variante.producto_id) ?? [];
    actuales.push(variante);
    variantesResumenPorProducto.set(variante.producto_id, actuales);
  }
  const existencias = (productosResumen.data ?? []).flatMap((producto) => {
    const opciones = (variantesResumenPorProducto.get(producto.id) ?? []).filter((variante) => variante.activo);
    return opciones.length > 0
      ? opciones.filter((variante) => variante.controla_stock).map((variante) => Number(variante.stock))
      : [Number(producto.stock)];
  });
  const resumenDisponible = !productosResumen.error && !variantesResumen.error;
  const agotados = resumenDisponible ? existencias.filter((stock) => stock <= 0).length : null;
  const stockBajo = resumenDisponible ? existencias.filter((stock) => stock > 0 && stock <= 3).length : null;
  const inicioPagina = totalProductos && productos.length ? desde + 1 : 0;
  const finPagina = totalProductos ? Math.min(desde + productos.length, totalProductos) : 0;
  const inicioBotones = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
  const paginasVisibles = Array.from(
    { length: Math.min(5, totalPaginas) },
    (_, indice) => inicioBotones + indice,
  );

  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">CATÁLOGO</p><h1 className="mt-2 text-3xl font-black">Productos y variantes</h1><p className="mt-2 text-sm text-zinc-400">Elige cuáles productos tendrán colores, tallas u otras opciones.</p></div>
      <div className="flex flex-wrap gap-3"><a href="/api/admin/exportar/inventario" download className="rounded-xl border border-lime-400/40 px-4 py-2 text-sm font-bold text-lime-300 hover:bg-lime-400/10">Descargar inventario CSV</a><Link href="/admin/pedidos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Ver pedidos</Link><Link href="/admin/productos/nuevo" className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-black hover:bg-lime-300">+ Nuevo producto</Link></div>
    </div>
    {!error && <div className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Productos visibles</p><p className="mt-2 text-3xl font-black text-lime-400">{resultadoVisibles.error ? "—" : (resultadoVisibles.count ?? 0)}</p></div>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-300">Stock bajo · 1 a 3</p><p className="mt-2 text-3xl font-black text-amber-300">{stockBajo ?? "—"}</p></div>
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5"><p className="text-xs font-bold uppercase tracking-wider text-red-300">Agotados</p><p className="mt-2 text-3xl font-black text-red-300">{agotados ?? "—"}</p></div>
    </div>}
    {error ? <p className="mt-7 rounded-xl bg-red-950 p-5 text-red-300">No fue posible cargar los productos.</p> :
      <div className="mt-7 grid gap-4 md:grid-cols-2">{(productos ?? []).map((producto) =>
        <article key={producto.id} className="flex flex-col items-stretch gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 min-[440px]:flex-row min-[440px]:items-center">
          {producto.imagen_url ? <div className="h-16 w-16 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${JSON.stringify(producto.imagen_url)})`}} /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800">📦</div>}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-black">{producto.nombre}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-black ${producto.activo ? "bg-lime-400/15 text-lime-300" : "bg-amber-400/15 text-amber-300"}`}>{producto.activo ? "VISIBLE" : "SUSPENDIDO"}</span>{producto.en_oferta && <span className="rounded-full bg-orange-400/15 px-2 py-1 text-[10px] font-black text-orange-300">OFERTA</span>}</div><p className="mt-1 break-words text-xs text-zinc-500">{producto.categoria} · SKU: {producto.sku || "Sin SKU"} · {stockPorColores.has(producto.id) ? `Stock físico: ${Number(producto.stock) + Number(stockPorColores.get(producto.id) ?? 0)} · Sin color: ${producto.stock}` : `Stock: ${producto.stock}`} · ${Number(producto.precio).toLocaleString("es-CO")}</p><p className="mt-2 text-sm font-bold text-lime-400">{conteo.get(producto.id) ?? 0} variantes</p></div>
          <Link href={`/admin/productos/${producto.id}`} className="min-h-11 rounded-xl bg-lime-400 px-4 py-2.5 text-center text-sm font-black text-black hover:bg-lime-300">Administrar</Link>
        </article>)}
      </div>}
    {!error && (totalProductos ?? 0) > 0 && <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-5 sm:flex-row sm:px-5">
      <p className="text-center text-sm text-zinc-400 sm:text-left">Mostrando <strong className="text-white">{inicioPagina}–{finPagina}</strong> de <strong className="text-white">{totalProductos}</strong> productos</p>
      {totalPaginas > 1 && <nav aria-label="Paginación de productos" className="flex flex-wrap items-center justify-center gap-2">
        {paginaActual > 1 ? <Link href={`/admin/productos?pagina=${paginaActual - 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-zinc-700 px-3 text-sm font-bold text-zinc-200 hover:border-lime-400 hover:text-lime-300 sm:px-4">← Anterior</Link> : <span aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center rounded-xl border border-zinc-800 px-3 text-sm font-bold text-zinc-600 sm:px-4">← Anterior</span>}
        {paginasVisibles.map((pagina) => <Link key={pagina} href={`/admin/productos?pagina=${pagina}`} aria-label={`Ir a la página ${pagina}`} aria-current={pagina === paginaActual ? "page" : undefined} className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-black ${pagina === paginaActual ? "border-lime-400 bg-lime-400 text-black" : "border-zinc-700 text-zinc-300 hover:border-lime-400 hover:text-lime-300"}`}>{pagina}</Link>)}
        {paginaActual < totalPaginas ? <Link href={`/admin/productos?pagina=${paginaActual + 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-zinc-700 px-3 text-sm font-bold text-zinc-200 hover:border-lime-400 hover:text-lime-300 sm:px-4">Siguiente →</Link> : <span aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center rounded-xl border border-zinc-800 px-3 text-sm font-bold text-zinc-600 sm:px-4">Siguiente →</span>}
      </nav>}
    </div>}
  </main>;
}
