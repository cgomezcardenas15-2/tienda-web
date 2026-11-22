"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

type DomicilioInicial = {
  valorConfirmado: number | null;
  pagoRecibido: boolean;
  valorConfirmadoEn: string | null;
  pagoRecibidoEn: string | null;
};

export default function DomicilioPedidoControl({
  pedidoId,
  estadoPedido,
  inicial,
}: {
  pedidoId: string;
  estadoPedido: string;
  inicial: DomicilioInicial;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(
    inicial.valorConfirmado === null ? "" : String(inicial.valorConfirmado),
  );
  const [pagoRecibido, setPagoRecibido] = useState(inicial.pagoRecibido);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const valorNumerico = valor.trim() === "" ? null : Number(valor);
  const registroCerrado = inicial.pagoRecibido;
  const pedidoEntregado = estadoPedido === "entregado";
  const valorValido =
    valorNumerico === null ||
    (Number.isSafeInteger(valorNumerico) && valorNumerico > 0);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje("");
    setError("");

    if (registroCerrado) {
      setError("Este cobro ya fue confirmado y no puede modificarse.");
      return;
    }

    if (!valorValido) {
      setError("El valor debe ser un número entero mayor que cero.");
      return;
    }

    if (pagoRecibido && valorNumerico === null) {
      setError("Primero registra el valor confirmado del domicilio.");
      return;
    }

    if (pagoRecibido && !pedidoEntregado) {
      setError("El domicilio solo puede marcarse como cobrado después de confirmar la entrega.");
      return;
    }

    if (
      pagoRecibido &&
      !inicial.pagoRecibido &&
      !window.confirm(
        `¿Confirmas que recibiste ${pesos.format(valorNumerico ?? 0)} por el domicilio?`,
      )
    ) {
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/admin/pedidos/${pedidoId}/domicilio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorConfirmado: valorNumerico,
          pagoRecibido,
        }),
      });
      const resultado = (await respuesta.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!respuesta.ok) {
        throw new Error(resultado?.error || "No fue posible guardar el domicilio.");
      }

      setMensaje(
        pagoRecibido
          ? "Valor guardado y domicilio marcado como cobrado."
          : valorNumerico === null
            ? "El domicilio quedó pendiente de confirmar."
            : "Valor del domicilio confirmado.",
      );
      router.refresh();
    } catch (errorActual) {
      setError(
        errorActual instanceof Error
          ? errorActual.message
          : "No fue posible guardar el domicilio.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="mt-5 rounded-2xl border border-amber-400/20 bg-black/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
            Cobro del domicilio
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Este valor se registra aparte: no cambia el total de los productos ni el pago de Wompi.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            pagoRecibido
              ? "bg-lime-400/15 text-lime-300"
              : valorNumerico !== null
                ? "bg-sky-400/15 text-sky-300"
                : "bg-amber-400/15 text-amber-300"
          }`}
        >
          {pagoRecibido
            ? "COBRADO"
            : valorNumerico !== null
              ? "VALOR CONFIRMADO"
              : "POR CONFIRMAR"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <label className="text-sm font-semibold text-zinc-300">
          Valor acordado con el cliente
          <div className="mt-2 flex min-h-12 items-center rounded-xl border border-zinc-700 bg-zinc-950 focus-within:border-lime-400">
            <span className="pl-4 font-black text-zinc-500">$</span>
            <input
              value={valor}
              disabled={registroCerrado}
              onChange={(event) => {
                setValor(event.target.value);
                if (event.target.value.trim() === "") setPagoRecibido(false);
              }}
              name="valorConfirmado"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="Ej. 8000"
              className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </label>

        <label className={`flex min-h-12 items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 ${registroCerrado || !pedidoEntregado ? "cursor-not-allowed opacity-65" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={pagoRecibido}
            disabled={registroCerrado || !pedidoEntregado || valorNumerico === null || !valorValido}
            onChange={(event) => setPagoRecibido(event.target.checked)}
            className="h-5 w-5 accent-lime-400"
          />
          El domicilio ya fue cobrado
        </label>
      </div>

      {!pedidoEntregado && !registroCerrado ? (
        <p className="mt-3 text-xs leading-5 text-amber-200/80">
          Puedes confirmar el valor desde ahora. La opción de marcarlo como cobrado se habilitará cuando el pedido figure como entregado.
        </p>
      ) : null}
      {registroCerrado ? (
        <p className="mt-3 text-xs leading-5 text-lime-200/80">
          Cobro finalizado. El valor queda bloqueado para conservar el historial del pedido.
        </p>
      ) : null}

      {(inicial.valorConfirmadoEn || inicial.pagoRecibidoEn) && (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          {inicial.valorConfirmadoEn
            ? `Valor confirmado: ${new Date(inicial.valorConfirmadoEn).toLocaleString("es-CO")}. `
            : ""}
          {inicial.pagoRecibidoEn
            ? `Cobro registrado: ${new Date(inicial.pagoRecibidoEn).toLocaleString("es-CO")}.`
            : ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={guardando || registroCerrado || !valorValido}
          className="min-h-11 rounded-xl bg-lime-400 px-5 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando…" : registroCerrado ? "Cobro confirmado" : "Guardar domicilio"}
        </button>
        {valorNumerico !== null && valorValido ? (
          <p className="text-sm font-black text-white">{pesos.format(valorNumerico)}</p>
        ) : null}
      </div>

      {mensaje ? <p role="status" className="mt-3 text-sm font-semibold text-lime-300">{mensaje}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-300">{error}</p> : null}
    </form>
  );
}
