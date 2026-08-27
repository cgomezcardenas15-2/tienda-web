"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SIGUIENTE_ESTADO: Record<string, { estado: string; etiqueta: string; confirmacion: string }> = {
  pagado: {
    estado: "preparando",
    etiqueta: "Comenzar preparación",
    confirmacion: "¿Confirmas que comenzarás a preparar este pedido?",
  },
  preparando: {
    estado: "enviado",
    etiqueta: "Marcar como enviado",
    confirmacion: "¿Confirmas que este pedido ya fue entregado a la transportadora?",
  },
  enviado: {
    estado: "entregado",
    etiqueta: "Marcar como entregado",
    confirmacion: "¿Confirmas que el cliente ya recibió este pedido?",
  },
};

export default function EstadoPedidoControl({ pedidoId, estadoActual, pagoAprobado }: { pedidoId: string; estadoActual: string; pagoAprobado: boolean }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const siguiente = SIGUIENTE_ESTADO[estadoActual];

  if (!pagoAprobado) {
    return <p className="text-sm text-amber-300">Este pedido no puede avanzar porque su pago no está aprobado.</p>;
  }

  if (estadoActual === "entregado") {
    return <p className="text-sm font-semibold text-lime-300">Proceso completado: el pedido fue entregado.</p>;
  }

  if (!siguiente) {
    return <p className="text-sm text-zinc-400">No hay una acción operativa disponible para este estado.</p>;
  }

  async function avanzarEstado() {
    if (!window.confirm(siguiente.confirmacion)) return;

    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: siguiente.estado }),
      });
      const resultado = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      if (!respuesta.ok) throw new Error(resultado?.error || "No fue posible actualizar el pedido.");
      router.refresh();
    } catch (errorActual) {
      setError(errorActual instanceof Error ? errorActual.message : "No fue posible actualizar el pedido.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={avanzarEstado} disabled={cargando} className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60">
        {cargando ? "Actualizando…" : siguiente.etiqueta}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
