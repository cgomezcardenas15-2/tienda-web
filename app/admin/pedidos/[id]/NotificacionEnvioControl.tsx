"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotificacionEnvioControl({ pedidoId, estadoPedido, notificadoEn }: { pedidoId: string; estadoPedido: string; notificadoEn: string | null }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const puedeNotificar = ["enviado", "entregado"].includes(estadoPedido);

  async function notificar() {
    setEnviando(true);
    setMensaje("");
    setError("");
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/notificar-envio`, { method: "POST" });
      const resultado = (await respuesta.json().catch(() => null)) as { mensaje?: string; error?: string } | null;
      if (!respuesta.ok) throw new Error(resultado?.mensaje || resultado?.error || "No fue posible enviar el correo.");
      setMensaje(resultado?.mensaje || "Correo enviado.");
      router.refresh();
    } catch (errorActual) {
      setError(errorActual instanceof Error ? errorActual.message : "No fue posible enviar el correo.");
    } finally {
      setEnviando(false);
    }
  }

  if (notificadoEn) {
    return <p className="mt-4 text-sm font-semibold text-lime-300">✓ Cliente notificado por correo.</p>;
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={notificar} disabled={!puedeNotificar || enviando} className="rounded-xl border border-zinc-600 px-5 py-3 text-sm font-black text-white transition hover:border-lime-400 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50">
        {enviando ? "Enviando correo…" : "Enviar guía por correo"}
      </button>
      {!puedeNotificar ? <p className="mt-2 text-xs text-zinc-500">Este botón se habilita al marcar el pedido como enviado.</p> : null}
      {mensaje ? <p role="status" className="mt-3 text-sm text-lime-300">{mensaje}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
