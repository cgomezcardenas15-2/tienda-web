import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import AjusteInventarioForm from "./AjusteInventarioForm";

export const dynamic = "force-dynamic";

type Producto = { id:string; nombre:string; sku:string|null; stock:number; controla_stock:boolean; activo:boolean };
type Variante = { id:string; producto_id:string; nombre:string; sku:string|null; stock:number; controla_stock:boolean; activo:boolean };
type Alerta = { productoId:string; nombre:string; variante:string|null; sku:string|null; stock:number };
type Ajuste = { id:number; producto_id:string; variante_id:string|null; tipo:string; cantidad:number; diferencia:number; cantidad_anterior:number; cantidad_nueva:number; motivo:string; creado_en:string };

function tipoVisual(tipo:string, diferencia:number) {
  if (tipo === "inventario_inicial") return { texto:"Inventario inicial", clase:"bg-blue-500/15 text-blue-300" };
  if (diferencia > 0) return { texto:"Entrada", clase:"bg-lime-400/15 text-lime-300" };
  return { texto:"Salida", clase:"bg-orange-500/15 text-orange-300" };
}

export default async function InventarioPage() {
  await requireAdmin();
  const [movimientosRes, productosRes, variantesRes, ajustesRes] = await Promise.all([
    supabaseAdmin.from("movimientos_inventario").select("id,producto_nombre,variante_nombre,sku,tipo,cantidad_anterior,cantidad_nueva,diferencia,creado_en").order("creado_en",{ascending:false}).limit(200),
    supabaseAdmin.from("productos").select("id,nombre,sku,stock,controla_stock,activo").order("nombre"),
    supabaseAdmin.from("variantes_producto").select("id,producto_id,nombre,sku,stock,controla_stock,activo").order("nombre"),
    supabaseAdmin.from("ajustes_inventario").select("id,producto_id,variante_id,tipo,cantidad,diferencia,cantidad_anterior,cantidad_nueva,motivo,creado_en").order("creado_en",{ascending:false}).limit(30),
  ]);
  const movimientos=movimientosRes.data??[];
  const productos=(productosRes.data??[]) as Producto[];
  const variantes=(variantesRes.data??[]) as Variante[];
  const porProducto=new Map<string,Variante[]>();
  for(const variante of variantes) porProducto.set(variante.producto_id,[...(porProducto.get(variante.producto_id)??[]),variante]);
  const alertas=productos.flatMap<Alerta>(producto=>{
    if(!producto.activo) return [];
    const opciones=(porProducto.get(producto.id)??[]).filter(v=>v.activo);
    if(opciones.length) return opciones.filter(v=>v.controla_stock&&Number(v.stock)<=3).map(v=>({productoId:producto.id,nombre:producto.nombre,variante:v.nombre,sku:v.sku,stock:Number(v.stock)}));
    return producto.controla_stock&&Number(producto.stock)<=3?[{productoId:producto.id,nombre:producto.nombre,variante:null,sku:producto.sku,stock:Number(producto.stock)}]:[];
  }).sort((a,b)=>a.stock-b.stock||a.nombre.localeCompare(b.nombre));
  const errorAlertas=productosRes.error||variantesRes.error;
  if (productosRes.error) console.error("Error consultando productos para alertas:", productosRes.error);
  if (variantesRes.error) console.error("Error consultando variantes para alertas:", variantesRes.error);
  const agotados=alertas.filter(a=>a.stock===0).length;
  const bajos=alertas.filter(a=>a.stock>0).length;
  const opciones=productos.flatMap(producto=>{
    if(!producto.activo) return [];
    const variantesActivas=(porProducto.get(producto.id)??[]).filter(v=>v.activo);
    if(variantesActivas.length) return variantesActivas.filter(v=>v.controla_stock).map(v=>({valor:`${producto.id}|${v.id}`,etiqueta:`${producto.nombre} · ${v.nombre} (${v.sku||"Sin SKU"})`,stock:Number(v.stock)}));
    return producto.controla_stock?[{valor:`${producto.id}|`,etiqueta:`${producto.nombre} (${producto.sku||"Sin SKU"})`,stock:Number(producto.stock)}]:[];
  });
  const ajustes=(ajustesRes.data??[]) as Ajuste[];
  const productoPorId=new Map(productos.map(p=>[p.id,p]));
  const variantePorId=new Map(variantes.map(v=>[v.id,v]));
  const faltaActivarAjustes=ajustesRes.error?.code==="42P01"||ajustesRes.error?.message?.includes("schema cache");

  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">CONTROL</p><h1 className="mt-2 text-3xl font-black">Inventario</h1><p className="mt-2 text-sm text-zinc-400">Alertas de existencias y últimos movimientos registrados.</p></div>
      <div className="flex flex-wrap gap-3"><a href="/api/admin/exportar/inventario" download className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Descargar inventario CSV</a><a href="/api/admin/exportar/movimientos" download className="rounded-xl border border-lime-400/40 px-4 py-2 text-sm font-bold text-lime-300 hover:bg-lime-400/10">Descargar historial CSV</a></div>
    </div>

    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Productos vigilados</p><p className="mt-2 text-3xl font-black">{errorAlertas?"—":productos.filter(p=>p.activo).length}</p></div>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-5"><p className="text-sm text-red-200/70">Agotados</p><p className="mt-2 text-3xl font-black text-red-300">{errorAlertas?"—":agotados}</p></div>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-5"><p className="text-sm text-amber-200/70">Stock bajo · 1 a 3</p><p className="mt-2 text-3xl font-black text-amber-300">{errorAlertas?"—":bajos}</p></div>
    </section>

    <section className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">AJUSTE CONTROLADO</p><h2 className="mt-2 text-2xl font-black">Corregir existencias</h2><p className="mt-2 text-sm text-zinc-400">Registra daños, pérdidas, devoluciones o diferencias encontradas al contar la mercancía.</p>{faltaActivarAjustes?<div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"><p className="font-black">Falta activar esta función en Supabase</p><p className="mt-1">Ejecuta una sola vez el archivo activar_ajustes_inventario.sql.</p></div>:<AjusteInventarioForm opciones={opciones}/>}</section>

    {!faltaActivarAjustes&&<section className="mt-7 overflow-hidden rounded-2xl border border-zinc-800"><div className="bg-zinc-900 p-5"><h2 className="text-xl font-black">Ajustes recientes</h2><p className="mt-1 text-sm text-zinc-400">Motivos registrados para cada corrección manual.</p></div>{ajustesRes.error?<p className="bg-zinc-950 p-5 text-amber-300">No fue posible consultar los ajustes.</p>:ajustes.length===0?<p className="bg-zinc-950 p-6 text-center text-zinc-400">Todavía no hay ajustes manuales.</p>:<div className="divide-y divide-zinc-800 bg-zinc-950">{ajustes.map(a=>{const producto=productoPorId.get(a.producto_id);const variante=a.variante_id?variantePorId.get(a.variante_id):null;return <article key={a.id} className="grid gap-3 p-5 md:grid-cols-[1fr_1.4fr_auto]"><div><p className="font-black">{producto?.nombre||"Producto"}{variante?` · ${variante.nombre}`:""}</p><p className="mt-1 text-xs text-zinc-500">{new Date(a.creado_en).toLocaleString("es-CO")}</p></div><div><p className="text-sm text-zinc-300">{a.motivo}</p><p className="mt-1 text-xs uppercase text-zinc-500">{a.tipo.replaceAll("_"," ")}</p></div><div className="text-right"><p className={`font-black ${a.diferencia>0?"text-lime-300":"text-orange-300"}`}>{a.diferencia>0?"+":""}{a.diferencia}</p><p className="mt-1 text-xs text-zinc-500">{a.cantidad_anterior} → {a.cantidad_nueva}</p></div></article>})}</div>}</section>}

    <section className="mt-7 overflow-hidden rounded-2xl border border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-5"><div><h2 className="text-xl font-black">Requieren atención</h2><p className="mt-1 text-sm text-zinc-400">Productos agotados o con tres unidades o menos.</p></div><Link href="/admin/productos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Ver todos los productos</Link></div>
      {errorAlertas?<p className="bg-zinc-950 p-5 text-amber-300">No fue posible consultar las alertas en este momento.</p>:alertas.length===0?<p className="bg-zinc-950 p-6 text-center text-lime-300">Todo bien: no hay productos agotados ni con stock bajo.</p>:<div className="divide-y divide-zinc-800 bg-zinc-950">{alertas.map(a=><article key={`${a.productoId}-${a.sku??a.variante??"base"}`} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-black">{a.nombre}</p>{a.variante&&<p className="mt-1 text-sm text-lime-300">{a.variante}</p>}<p className="mt-1 text-xs text-zinc-500">SKU: {a.sku||"Sin SKU"}</p></div><div className="flex items-center gap-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${a.stock===0?"bg-red-500/15 text-red-300":"bg-amber-400/15 text-amber-300"}`}>{a.stock===0?"AGOTADO":`${a.stock} UNIDADES`}</span><Link href={`/admin/productos/${a.productoId}`} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-bold hover:border-lime-400 hover:text-lime-300">Administrar</Link></div></article>)}</div>}
    </section>

    <section className="mt-8"><h2 className="text-2xl font-black">Historial de inventario</h2><p className="mt-2 text-sm text-zinc-400">Últimos 200 cambios registrados automáticamente.</p>
      {movimientosRes.error?<p className="mt-5 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">No fue posible cargar el historial.</p>:movimientos.length===0?<p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">Todavía no se han registrado cambios de existencias.</p>:<div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-800"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Producto</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Movimiento</th><th className="px-5 py-4 text-right">Anterior</th><th className="px-5 py-4 text-right">Cambio</th><th className="px-5 py-4 text-right">Nuevo</th></tr></thead><tbody className="divide-y divide-zinc-800 bg-zinc-950">{movimientos.map(m=>{const visual=tipoVisual(m.tipo,Number(m.diferencia));return <tr key={m.id} className="hover:bg-zinc-900/70"><td className="px-5 py-4 text-zinc-400">{new Date(m.creado_en).toLocaleString("es-CO")}</td><td className="px-5 py-4"><p className="font-bold">{m.producto_nombre}</p>{m.variante_nombre&&<p className="mt-1 text-xs text-lime-400">{m.variante_nombre}</p>}</td><td className="px-5 py-4 text-zinc-400">{m.sku||"—"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${visual.clase}`}>{visual.texto}</span></td><td className="px-5 py-4 text-right">{m.cantidad_anterior}</td><td className={`px-5 py-4 text-right font-black ${Number(m.diferencia)>0?"text-lime-300":"text-orange-300"}`}>{Number(m.diferencia)>0?"+":""}{m.diferencia}</td><td className="px-5 py-4 text-right font-black">{m.cantidad_nueva}</td></tr>})}</tbody></table></div>}
    </section>
  </main>;
}
