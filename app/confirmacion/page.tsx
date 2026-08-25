"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";

function formatoPesos(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function ConfirmacionPage() {
  const { items, subtotal } = useCart();

  const carritoVacio = items.length === 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] px-6 py-14 text-white lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Encabezado */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-8 sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#82f000]/10 blur-[120px]" />

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-3xl">
                ✓
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
                Confirmación NOVA
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Tu pedido está casi listo
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/50">
                Esta pantalla ya está preparada para mostrar la confirmación
                final de una compra. Durante esta etapa de desarrollo todavía
                no se realiza ningún cobro ni se genera un pedido definitivo.
              </p>
            </div>
          </section>

          {/* Estado del pago */}
          <section className="mt-6 rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                ⏳
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                  Pago pendiente de integración
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Todavía no se ha realizado ningún cobro
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                  Cuando conectemos la pasarela de pagos real, esta página solo
                  se mostrará después de que NOVA reciba la confirmación segura
                  de que la transacción fue aprobada.
                </p>
              </div>
            </div>
          </section>

          {/* Resumen */}
          {!carritoVacio && (
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                  Resumen
                </p>

                <h2 className="text-2xl font-semibold">
                  Productos de tu compra
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-black/10 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.nombre}
                      </p>

                      <p className="mt-1 text-sm text-white/35">
                        Cantidad: {item.cantidad}
                      </p>
                    </div>

                    <p className="font-bold text-[#82f000]">
                      {formatoPesos(item.precio * item.cantidad)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-white/[0.08] pt-6">
                <span className="text-sm text-white/50">
                  Total provisional
                </span>

                <span className="text-3xl font-bold text-[#82f000]">
                  {formatoPesos(subtotal)}
                </span>
              </div>
            </section>
          )}

          {/* Lo que ocurrirá en producción */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <span className="text-[#82f000]">01</span>

              <h3 className="mt-4 font-semibold">
                Pago aprobado
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                El proveedor de pagos confirmará la transacción de forma
                segura.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <span className="text-[#82f000]">02</span>

              <h3 className="mt-4 font-semibold">
                Pedido generado
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                NOVA creará el pedido únicamente después de comprobar el pago.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <span className="text-[#82f000]">03</span>

              <h3 className="mt-4 font-semibold">
                Facturación
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                La factura electrónica válida se generará mediante el proveedor
                correspondiente y se enviará al correo de facturación.
              </p>
            </div>
          </section>

          {/* Navegación */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#82f000] px-6 py-3 font-bold text-black transition hover:bg-[#9cff35]"
            >
              Volver al inicio
            </a>

            <a
              href="/carrito"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-[#82f000]/50 hover:text-[#82f000]"
            >
              Volver al carrito
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}