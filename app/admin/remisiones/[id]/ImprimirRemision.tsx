export default function ImprimirRemision({ pedidoId }: { pedidoId: string }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <a href={`/api/admin/pedidos/${pedidoId}/remision/pdf`} className="inline-flex min-h-11 items-center rounded-xl bg-lime-400 px-4 font-black text-black hover:bg-lime-300">Descargar PDF</a>
      <a href={`/api/admin/pedidos/${pedidoId}/remision/imagen`} className="inline-flex min-h-11 items-center rounded-xl border border-zinc-600 px-4 font-black text-white hover:border-lime-400 hover:text-lime-400">Descargar imagen</a>
      <a href={`/api/admin/pedidos/${pedidoId}/remision/excel`} className="inline-flex min-h-11 items-center rounded-xl border border-zinc-600 px-4 font-black text-white hover:border-lime-400 hover:text-lime-400">Descargar Excel</a>
    </div>
  );
}
