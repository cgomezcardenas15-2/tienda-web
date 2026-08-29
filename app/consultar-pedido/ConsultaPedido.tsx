"use client";

import { FormEvent, useState } from "react";

type PedidoConsultado = {
  numeroPedido: string;
  creadoEn: string;
  total: number;
  moneda: string;
  estadoPago: string;
  estadoPedido: string;
  puedeRetomarPago: boolean;
  envio: { transportadora: string | null; servicio: string | null; numeroGuia: string | null; urlSeguimiento: string | null };
  productos: { id: string; nombre: string; cantidad: number; variante: string | null }[];
};

const ESTADOS: Record<string, { titulo: string; descripcion: string; paso: number }> = {
  pendiente_pago: { titulo: "Esperando confirmación del pago", descripcion: "El pedido todavía no tiene un pago aprobado.", paso: 0 },
  pagado: { titulo: "Pago aprobado", descripcion: "Recibimos el pago y pronto comenzaremos la preparación.", paso: 1 },
  preparando: { titulo: "Preparando tu pedido", descripcion: "Estamos organizando los productos para entregarlos a la transportadora.", paso: 2 },
  enviado: { titulo: "Pedido enviado", descripcion: "Tu pedido ya está en camino.", paso: 3 },
  entregado: { titulo: "Pedido entregado", descripcion: "El proceso de entrega aparece como finalizado.", paso: 4 },
  cancelado: { titulo: "Pedido cancelado", descripcion: "Este pedido fue cancelado.", paso: 0 },
};

function urlSegura(valor: string | null) {
  if (!valor) return null;
  try { const url = new URL(valor); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}

export default function ConsultaPedido() {
  const [numero, setNumero] = useState("");
  const [correo, setCorreo] = useState("");
  const [pedido, setPedido] = useState<PedidoConsultado | null>(null);
  const [error, setError] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [retomando, setRetomando] = useState(false);

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPedido(null); setConsultando(true);
    const respuesta = await fetch("/api/consultar-pedido", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: numero, correo }) });
    const data = await respuesta.json().catch(() => ({})); setConsultando(false);
    if (!respuesta.ok) { setError(data.error || "No fue posible consultar el pedido."); return; }
    setPedido(data.pedido);
  }

  async function retomarPago() {
    setError(""); setRetomando(true);
    const respuesta = await fetch("/api/consultar-pedido/retomar-pago", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: numero, correo }) });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || !data.checkoutUrl) { setRetomando(false); setError(data.error || "No fue posible retomar el pago."); return; }
    window.location.assign(data.checkoutUrl);
  }

  const estado = pedido
    ? pedido.estadoPago === "vencido"
      ? { titulo: "El tiempo de pago venció", descripcion: "La reserva finalizó. Puedes intentar el pago nuevamente si todavía hay unidades disponibles.", paso: 0 }
      : (ESTADOS[pedido.estadoPedido] || { titulo: "Pedido en proceso", descripcion: "Estamos actualizando la información de tu pedido.", paso: 0 })
    : null;
  const seguimiento = pedido ? urlSegura(pedido.envio.urlSeguimiento) : null;
  return <>
    <form onSubmit={consultar} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-white/65">Número del pedido<input required value={numero} onChange={(e) => setNumero(e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#82f000]" placeholder="NOVA-000001" /></label>
        <label className="text-sm font-semibold text-white/65">Correo utilizado en la compra<input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#82f000]" placeholder="correo@ejemplo.com" /></label>
      </div>
      <p className="mt-4 text-xs leading-5 text-white/35">Ambos datos deben coincidir con la compra. Por seguridad no mostraremos dirección, teléfono ni documento.</p>
      {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-300">{error}</p>}
      <button disabled={consultando} className="mt-5 cursor-pointer rounded-xl bg-[#82f000] px-6 py-3 font-black text-black hover:bg-[#9cff35] disabled:cursor-not-allowed disabled:opacity-50">{consultando ? "Consultando..." : "Consultar pedido"}</button>
    </form>

    {pedido && estado && <section className="mt-6 space-y-5">
      <article className="rounded-3xl border border-[#82f000]/25 bg-[#82f000]/[0.045] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#82f000]">Estado actual</p><h2 className="mt-3 text-2xl font-black">{estado.titulo}</h2><p className="mt-2 text-sm leading-6 text-white/50">{estado.descripcion}</p>
        <div className="mt-7 grid grid-cols-4 gap-2">{["Pagado", "Preparando", "Enviado", "Entregado"].map((paso, indice) => <div key={paso}><div className={`h-2 rounded-full ${estado.paso >= indice + 1 ? "bg-[#82f000]" : "bg-white/10"}`} /><p className="mt-2 text-[10px] font-bold text-white/45 sm:text-xs">{paso}</p></div>)}</div>
        {pedido.puedeRetomarPago && <button type="button" disabled={retomando} onClick={retomarPago} className="mt-6 rounded-xl bg-[#82f000] px-5 py-3 font-black text-black disabled:opacity-50">{retomando ? "Abriendo pago..." : "Retomar pago seguro"}</button>}
      </article>
      <div className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h3 className="font-black">Información del pedido</h3><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-white/35">Número</dt><dd className="mt-1 font-semibold">{pedido.numeroPedido}</dd></div><div><dt className="text-white/35">Fecha</dt><dd className="mt-1">{new Date(pedido.creadoEn).toLocaleString("es-CO")}</dd></div><div><dt className="text-white/35">Total</dt><dd className="mt-1 text-xl font-black text-[#82f000]">{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(pedido.total)}</dd></div></dl></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h3 className="font-black">Envío</h3>{pedido.envio.numeroGuia ? <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-white/35">Transportadora</dt><dd className="mt-1 font-semibold">{pedido.envio.transportadora || "Por confirmar"}</dd></div><div><dt className="text-white/35">Número de guía</dt><dd className="mt-1 font-semibold">{pedido.envio.numeroGuia}</dd></div>{seguimiento && <div className="pt-2"><a href={seguimiento} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-[#82f000]/40 px-4 py-2 font-bold text-[#82f000] hover:bg-[#82f000]/10">Rastrear envío ↗</a></div>}</dl> : <p className="mt-4 text-sm leading-6 text-white/45">La guía aparecerá aquí cuando entreguemos el pedido a la transportadora.</p>}</article>
      </div>
      <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h3 className="font-black">Productos</h3><div className="mt-4 divide-y divide-white/10">{pedido.productos.length ? pedido.productos.map((producto) => <div key={producto.id} className="flex justify-between gap-4 py-3 text-sm"><div><p className="font-semibold">{producto.nombre}</p>{producto.variante && <p className="mt-1 text-xs text-[#82f000]">{producto.variante}</p>}</div><p className="text-white/45">Cantidad: {producto.cantidad}</p></div>) : <p className="py-3 text-sm text-white/40">El detalle de productos no está disponible.</p>}</div></article>
    </section>}
  </>;
}
