import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
type Venta={id:string;total:number;moneda:string;creado_en:string};
type Compra={total:number;moneda:string;fecha_compra:string};
type LineaCosto={pedido_id:string;precio_unitario:number;cantidad:number;costo_unitario_capturado:number|null};
const dinero=new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});

function inicioMesBogota(){
  const partes=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit"}).formatToParts(new Date());
  return `${partes.find(p=>p.type==="year")?.value}-${partes.find(p=>p.type==="month")?.value}-01`;
}

async function consultarConReintentos<T>(consulta:()=>PromiseLike<T>){
  let resultado:T|undefined;
  for(let intento=1;intento<=3;intento+=1){
    resultado=await consulta();
    const posible=resultado as {error?:unknown};
    if(!posible.error||intento===3) return resultado;
    await new Promise(resolve=>setTimeout(resolve,intento*500));
  }
  return resultado as T;
}

export default async function ResumenPage(){
  await requireAdmin();
  const [ventasRes,comprasRes]=await Promise.all([
    consultarConReintentos(()=>supabaseAdmin.from("pedidos").select("id,total,moneda,creado_en").eq("estado_pago","aprobado").order("creado_en",{ascending:false}).limit(5000)),
    consultarConReintentos(()=>supabaseAdmin.from("compras").select("total,moneda,fecha_compra").eq("estado","recibida").order("fecha_compra",{ascending:false}).limit(5000)),
  ]);
  const ventas=((ventasRes.data??[]) as Venta[]).filter(v=>v.moneda==="COP");
  const compras=((comprasRes.data??[]) as Compra[]).filter(c=>c.moneda==="COP");
  const idsVentas=ventas.map(v=>v.id);
  const costosRes=idsVentas.length?await supabaseAdmin.from("productos_pedido").select("pedido_id,precio_unitario,cantidad,costo_unitario_capturado").in("pedido_id",idsVentas):{data:[],error:null};
  const lineas=((costosRes.data??[]) as LineaCosto[]);
  const desde=inicioMesBogota();
  const ventasMes=ventas.filter(v=>v.creado_en.slice(0,10)>=desde);
  const comprasMes=compras.filter(c=>c.fecha_compra>=desde);
  const sumar=(items:{total:number}[])=>items.reduce((suma,item)=>suma+Number(item.total),0);
  const totalVentas=sumar(ventas),totalCompras=sumar(compras),ventasActuales=sumar(ventasMes),comprasActuales=sumar(comprasMes);
  const movimientoMes=ventasActuales-comprasActuales;
  const promedio=ventasMes.length?ventasActuales/ventasMes.length:0;
  const ventasMesIds=new Set(ventasMes.map(v=>v.id));
  const lineasConCosto=lineas.filter(l=>l.costo_unitario_capturado!==null&&Number(l.costo_unitario_capturado)>0);
  const lineasCostoMes=lineasConCosto.filter(l=>ventasMesIds.has(l.pedido_id));
  const utilidad=(items:LineaCosto[])=>items.reduce((total,l)=>total+(Number(l.precio_unitario)-Number(l.costo_unitario_capturado))*Number(l.cantidad),0);
  const ingresoCubierto=(items:LineaCosto[])=>items.reduce((total,l)=>total+Number(l.precio_unitario)*Number(l.cantidad),0);
  const utilidadMes=utilidad(lineasCostoMes),utilidadHistorica=utilidad(lineasConCosto),ingresoCostoMes=ingresoCubierto(lineasCostoMes),ingresoCostoHistorico=ingresoCubierto(lineasConCosto);
  const margenMes=ingresoCostoMes>0?utilidadMes/ingresoCostoMes*100:0;
  const margenHistorico=ingresoCostoHistorico>0?utilidadHistorica/ingresoCostoHistorico*100:0;
  const costosActivos=!costosRes.error;
  const error=ventasRes.error||comprasRes.error;
  if(ventasRes.error) console.error("Error consultando ventas del resumen:",ventasRes.error);
  if(comprasRes.error) console.error("Error consultando compras del resumen:",comprasRes.error);

  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">VISIÓN DEL NEGOCIO</p><h1 className="mt-2 text-3xl font-black">Resumen financiero</h1><p className="mt-2 text-sm text-zinc-400">Ventas aprobadas y compras recibidas registradas en NOVA.</p></div><div className="flex gap-3"><Link href="/admin/pedidos" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:border-lime-400">Ver pedidos</Link><Link href="/admin/compras" className="rounded-xl border border-lime-400/50 px-4 py-2 text-sm font-bold text-lime-300 hover:bg-lime-400/10">Ver compras</Link></div></div>
    {error?<div className="mt-7 rounded-2xl border border-amber-600/40 bg-amber-950/30 p-5 text-amber-200"><p className="font-black">No fue posible actualizar el resumen.</p><p className="mt-1 text-sm text-amber-200/70">Los datos siguen guardados. Intenta actualizar en unos segundos.</p></div>:<>
      <section className="mt-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">MES ACTUAL</p><h2 className="mt-2 text-2xl font-black">Actividad del mes</h2></div><span className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400">Desde {desde}</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-lime-500/30 bg-lime-500/[0.06] p-5"><p className="text-sm text-lime-200/70">Ventas aprobadas</p><p className="mt-2 text-2xl font-black text-lime-300">{dinero.format(ventasActuales)}</p><p className="mt-2 text-xs text-zinc-500">{ventasMes.length} pedidos pagados</p></article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Compras recibidas</p><p className="mt-2 text-2xl font-black">{dinero.format(comprasActuales)}</p><p className="mt-2 text-xs text-zinc-500">{comprasMes.length} compras cerradas</p></article>
          <article className={`rounded-2xl border p-5 ${movimientoMes>=0?"border-blue-500/30 bg-blue-500/[0.06]":"border-orange-500/30 bg-orange-500/[0.06]"}`}><p className="text-sm text-zinc-400">Ventas menos compras</p><p className={`mt-2 text-2xl font-black ${movimientoMes>=0?"text-blue-300":"text-orange-300"}`}>{dinero.format(movimientoMes)}</p><p className="mt-2 text-xs text-zinc-500">Movimiento comercial simple</p></article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Ticket promedio</p><p className="mt-2 text-2xl font-black">{dinero.format(promedio)}</p><p className="mt-2 text-xs text-zinc-500">Promedio por pedido aprobado</p></article>
        </div>
      </section>
      <section className="mt-7 grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Ventas aprobadas históricas</p><p className="mt-2 text-3xl font-black text-lime-300">{dinero.format(totalVentas)}</p></article><article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Compras recibidas históricas</p><p className="mt-2 text-3xl font-black">{dinero.format(totalCompras)}</p></article></section>
      <section className="mt-7"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">RENTABILIDAD</p><h2 className="mt-2 text-2xl font-black">Utilidad bruta por productos vendidos</h2></div>{!costosActivos?<div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200"><p className="font-black">Falta activar el cálculo de costos</p><p className="mt-1 text-sm">Ejecuta activar_costos_utilidad.sql en Supabase.</p></div>:<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article className="rounded-2xl border border-lime-500/30 bg-lime-500/[0.06] p-5"><p className="text-sm text-zinc-400">Utilidad bruta del mes</p><p className="mt-2 text-2xl font-black text-lime-300">{dinero.format(utilidadMes)}</p></article><article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Margen bruto del mes</p><p className="mt-2 text-2xl font-black">{margenMes.toFixed(1)}%</p></article><article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Utilidad bruta histórica</p><p className="mt-2 text-2xl font-black text-lime-300">{dinero.format(utilidadHistorica)}</p></article><article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Margen bruto histórico</p><p className="mt-2 text-2xl font-black">{margenHistorico.toFixed(1)}%</p></article></div>}<p className="mt-3 text-xs text-zinc-500">Calculado solo con líneas de venta que ya tienen un costo capturado. Cobertura actual: {lineasConCosto.length} de {lineas.length} líneas.</p></section>
    </>}
    <aside className="mt-7 rounded-2xl border border-blue-500/25 bg-blue-500/[0.06] p-5 text-sm text-blue-100"><p className="font-black">Cómo interpretar este resumen</p><p className="mt-2 leading-6 text-blue-100/70">“Ventas menos compras” vigila el movimiento general de dinero. La utilidad bruta usa el costo promedio capturado en cada producto vendido; todavía no descuenta gastos administrativos, impuestos de renta u otros gastos del negocio.</p></aside>
  </main>;
}
