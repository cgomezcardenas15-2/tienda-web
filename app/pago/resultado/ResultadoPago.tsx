"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { trackMetaEvent } from "../../lib/metaPixel";

const CLAVE_INTENTO_CHECKOUT = "nova_checkout_intento_v1";

type Resultado = {
  ok: boolean;
  estado?: string;
  aprobado?: boolean;
  mensaje?: string | null;
  error?: string;
  pedidoId?: string;
  numeroPedido?: string;
  compraMeta?: {
    pedidoId: string;
    numeroPedido: string;
    value: number;
    currency: "COP";
    contentIds: string[];
    contents: Array<{ id: string; quantity: number; item_price: number }>;
    numItems: number;
  } | null;
};

export default function ResultadoPago() {
  const parametros = useSearchParams();
  const id = parametros.get("id");
  const { vaciarCarrito } = useCart();
  const carritoVaciado = useRef(false);
  const compraMetaRegistrada = useRef(false);
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(() =>
    id ? null : { ok: false, error: "Wompi no envió un identificador de transacción." }
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    const controlador = new AbortController();
    let temporizador: number | undefined;
    let intento = 0;

    async function verificar() {
      try {
        const respuesta = await fetch(
          `/api/pagos/wompi/verificar?id=${encodeURIComponent(id!)}`,
          { cache: "no-store", signal: controlador.signal }
        );
        const contenido = (await respuesta.json()) as Resultado;
        setResultado(contenido);

        if (contenido.estado === "PENDING" && intento < 5) {
          intento += 1;
          temporizador = window.setTimeout(verificar, 4000);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResultado({ ok: false, error: "No fue posible comprobar el pago." });
        }
      }
    }

    void verificar();
    return () => {
      controlador.abort();
      if (temporizador) window.clearTimeout(temporizador);
    };
  }, [id, revision]);

  useEffect(() => {
    if (resultado?.aprobado && !carritoVaciado.current) {
      carritoVaciado.current = true;
      window.sessionStorage.removeItem(CLAVE_INTENTO_CHECKOUT);
      vaciarCarrito();
    }
  }, [resultado?.aprobado, vaciarCarrito]);

  useEffect(() => {
    const compra = resultado?.compraMeta;
    if (!resultado?.aprobado || !compra || compraMetaRegistrada.current) return;

    const storageKey = `nova_meta_purchase_${compra.pedidoId}`;
    if (window.localStorage.getItem(storageKey)) {
      compraMetaRegistrada.current = true;
      return;
    }

    const tracked = trackMetaEvent(
      "Purchase",
      {
        content_ids: compra.contentIds,
        content_type: "product",
        contents: compra.contents,
        currency: "COP",
        value: compra.value,
        num_items: compra.numItems,
      },
      `purchase:${compra.pedidoId}`
    );

    if (tracked) {
      window.localStorage.setItem(storageKey, "1");
      compraMetaRegistrada.current = true;
    }
  }, [resultado]);

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
    <main className="min-h-screen bg-[#080a08] px-4 py-10 text-white sm:px-6 sm:py-20">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
          Resultado del pago
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{titulo}</h1>
        <p className="mt-5 leading-7 text-white/55">{descripcion}</p>
        {resultado?.estado && (
          <p className="mt-5 text-sm text-white/35">Estado Wompi: {resultado.estado}</p>
        )}
        {resultado?.aprobado && resultado.numeroPedido && (
          <div className="mt-6 rounded-2xl border border-[#82f000]/25 bg-[#82f000]/[0.05] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82f000]">Número de tu pedido</p>
            <p className="mt-2 break-all font-mono text-lg font-bold">{resultado.numeroPedido}</p>
            <p className="mt-2 text-xs text-white/40">Guárdalo para consultar el estado y la guía de envío.</p>
          </div>
        )}
        <div className="mt-8 grid gap-3 min-[440px]:flex min-[440px]:flex-wrap">
          <Link href="/" className="rounded-xl bg-[#82f000] px-6 py-3 text-center font-bold text-black">
            Volver al inicio
          </Link>
          {resultado?.aprobado && (
            <Link href="/consultar-pedido" className="rounded-xl border border-white/15 px-6 py-3 text-center font-semibold">
              Consultar mi pedido
            </Link>
          )}
          {!resultado?.aprobado && (
            <Link href="/checkout" className="rounded-xl border border-white/15 px-6 py-3 text-center font-semibold">
              Volver al checkout
            </Link>
          )}
          {resultado?.estado === "PENDING" && (
            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setRevision((actual) => actual + 1);
              }}
              className="min-h-12 cursor-pointer rounded-xl border border-[#82f000]/40 px-6 py-3 text-center font-semibold text-[#82f000]"
            >
              Comprobar nuevamente
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
