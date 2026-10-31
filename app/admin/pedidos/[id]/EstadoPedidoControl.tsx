"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SIGUIENTE_ESTADO: Record<string, { estado: string; etiqueta: string; confirmacion: string }> = {
  confirmado: {
    estado: "preparando",
    etiqueta: "Comenzar preparación",
    confirmacion: "¿Confirmas que comenzarás a preparar este pedido contraentrega?",
  },
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

export default function EstadoPedidoControl({
  pedidoId,
  estadoActual,
  pagoAprobado,
  metodoPago,
  envioZona,
}: {
  pedidoId: string;
  estadoActual: string;
  pagoAprobado: boolean;
  metodoPago: string;
  envioZona: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const esContraentregaCali = metodoPago === "contraentrega" && envioZona === "CALI";
  const siguiente = SIGUIENTE_ESTADO[estadoActual];

  if (!pagoAprobado && !esContraentregaCali) {
    return <p className="text-sm text-amber-300">Este pedido no puede avanzar porque su pago no está aprobado.</p>;
  }

  if (estadoActual === "entregado") {
    return <p className="text-sm font-semibold text-lime-300">Proceso completado: el pedido fue entregado.</p>;
  }

  async function ejecutarContraentrega(accion: "confirmar_entrega" | "cancelar") {
    const confirmacion = accion === "confirmar_entrega"
      ? "¿Confirmas que el cliente recibió el pedido y entregó el efectivo completo? Esta acción registrará el pago."
      : "¿Confirmas que deseas cancelar este pedido? Las unidades reservadas volverán al inventario.";
    if (!window.confirm(confirmacion)) return;

    setCargando(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/contraentrega`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const resultado = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      if (!respuesta.ok) throw new Error(resultado?.error || "No fue posible actualizar la contraentrega.");
      setMensaje(accion === "confirmar_entrega" ? "Efectivo recibido y entrega confirmada." : "Pedido cancelado; inventario restaurado.");
      router.refresh();
    } catch (errorActual) {
      setError(errorActual instanceof Error ? errorActual.message : "No fue posible actualizar la contraentrega.");
    } finally {
      setCargando(false);
    }
  }

  if (esContraentregaCali && estadoActual === "enviado") {
    return (
      <div>
        <p className="mb-4 text-sm text-amber-200">El pago sigue pendiente. Confírmalo únicamente cuando el domiciliario entregue el pedido y reciba el efectivo.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => ejecutarContraentrega("confirmar_entrega")} disabled={cargando} className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60">
            {cargando ? "Actualizando…" : "Confirmar efectivo y entrega"}
          </button>
          <button type="button" onClick={() => ejecutarContraentrega("cancelar")} disabled={cargando} className="rounded-xl border border-red-400/50 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60">Cancelar pedido</button>
        </div>
        {mensaje ? <p role="status" className="mt-3 text-sm text-lime-300">{mensaje}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    );
  }

  if (!siguiente) {
    return <p className="text-sm text-zinc-400">No hay una acción operativa disponible para este estado.</p>;
  }

  async function avanzarEstado() {
    if (!window.confirm(siguiente.confirmacion)) return;

    setCargando(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: siguiente.estado }),
      });
      const resultado = (await respuesta.json().catch(() => null)) as { error?: string; notificacion?: { mensaje?: string } | null } | null;
      if (!respuesta.ok) throw new Error(resultado?.error || "No fue posible actualizar el pedido.");
      if (resultado?.notificacion?.mensaje) setMensaje(resultado.notificacion.mensaje);
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
        {cargando ? "Actualizando…" : esContraentregaCali && siguiente.estado === "enviado" ? "Marcar como en reparto" : siguiente.etiqueta}
      </button>
      {esContraentregaCali && ["confirmado", "preparando"].includes(estadoActual) ? (
        <button type="button" onClick={() => ejecutarContraentrega("cancelar")} disabled={cargando} className="ml-3 rounded-xl border border-red-400/50 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60">Cancelar y devolver stock</button>
      ) : null}
      {mensaje ? <p role="status" className="mt-3 text-sm text-lime-300">{mensaje}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
