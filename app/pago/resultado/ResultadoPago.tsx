"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Resultado = {
  ok: boolean;
  estado?: string;
  aprobado?: boolean;
  mensaje?: string | null;
  error?: string;
};

export default function ResultadoPago() {
  const parametros = useSearchParams();
  const id = parametros.get("id");
  const [resultado, setResultado] = useState<Resultado | null>(() =>
    id ? null : { ok: false, error: "Wompi no envió un identificador de transacción." }
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    const controlador = new AbortController();

    async function verificar() {
      try {
        const respuesta = await fetch(
          `/api/pagos/wompi/verificar?id=${encodeURIComponent(id!)}`,
          { cache: "no-store", signal: controlador.signal }
        );
        const contenido = (await respuesta.json()) as Resultado;
        setResultado(contenido);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResultado({ ok: false, error: "No fue posible comprobar el pago." });
        }
      }
    }

    void verificar();
    return () => controlador.abort();
  }, [id]);

  const titulo = !resultado
    ? "Estamos verificando tu pago"
    : resultado.aprobado
      ? "Pago aprobado"
      : resultado.estado === "PENDING"
        ? "Pago en proceso"
        : "El pago no fue aprobado";

  const descripcion = !resultado
    ? "NOVA está consultando la transacción directamente con Wompi."
    : resultado.aprobado
      ? "Wompi confirmó el pago y tu pedido quedó confirmado."
      : resultado.error || resultado.mensaje || "Puedes volver al checkout e intentarlo nuevamente.";

  return (
    <main className="min-h-screen bg-[#080a08] px-6 py-20 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.035] p-8 sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
          Resultado del pago
        </p>
        <h1 className="mt-4 text-4xl font-bold">{titulo}</h1>
        <p className="mt-5 leading-7 text-white/55">{descripcion}</p>
        {resultado?.estado && (
          <p className="mt-5 text-sm text-white/35">Estado Wompi: {resultado.estado}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-xl bg-[#82f000] px-6 py-3 font-bold text-black">
            Volver al inicio
          </Link>
          {!resultado?.aprobado && (
            <Link href="/checkout" className="rounded-xl border border-white/15 px-6 py-3 font-semibold">
              Volver al checkout
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
