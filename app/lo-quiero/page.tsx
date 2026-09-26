"use client";

import { FormEvent, useRef, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const WHATSAPP_NUMBER = "573105238430";

const productosPropuestos = [
  {
    nombre: "Organizador multifuncional",
    categoria: "Hogar",
    descripcion: "Una idea práctica para mantener cada espacio en orden.",
    tono: "from-[#82f000]/25 via-[#19310b] to-black",
  },
  {
    nombre: "Kit para celebraciones",
    categoria: "Piñatería",
    descripcion: "Opciones llamativas para cumpleaños y fechas especiales.",
    tono: "from-[#ff9d00]/25 via-[#351d05] to-black",
  },
  {
    nombre: "Accesorio para mascotas",
    categoria: "Mascotas",
    descripcion: "Productos útiles para consentir y cuidar a tu mascota.",
    tono: "from-[#00c8ff]/20 via-[#062633] to-black",
  },
  {
    nombre: "Accesorio para moto",
    categoria: "Motos",
    descripcion: "Ideas prácticas para hacer cada recorrido más cómodo y seguro.",
    tono: "from-[#a855f7]/20 via-[#241032] to-black",
  },
];

export default function LoQuieroPage() {
  const [producto, setProducto] = useState("");
  const [categoria, setCategoria] = useState("Hogar");
  const [uso, setUso] = useState("Para mí");
  const [cantidad, setCantidad] = useState("1");
  const [detalles, setDetalles] = useState("");
  const formularioRef = useRef<HTMLFormElement>(null);

  function elegirProducto(nombre: string, categoriaElegida: string) {
    setProducto(nombre);
    setCategoria(categoriaElegida);
    window.setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function pedirOtroProducto() {
    setProducto("");
    setCategoria("Otra");
    window.setTimeout(() => {
      formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function prepararSolicitud(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensaje = [
      "Hola NOVA, vi la sección LO QUIERO y me interesa este producto:",
      "",
      `Producto: ${producto.trim()}`,
      `Categoría: ${categoria}`,
      `Lo necesito: ${uso.toLowerCase()}`,
      `Cantidad aproximada: ${cantidad}`,
      detalles.trim() ? `Detalles: ${detalles.trim()}` : "",
      "",
      "Entiendo que esta solicitud no es una compra ni una reserva.",
    ].filter(Boolean).join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-black px-5 py-14 text-white lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#82f000]/10 blur-[150px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="lg:sticky lg:top-40">
              <span className="inline-flex rounded-full border border-[#82f000]/35 bg-[#82f000]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#82f000]">
                LO QUIERO
              </span>

              <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                ¿Lo quieres?
                <span className="mt-2 block text-[#82f000]">Pídelo.</span>
                <span className="mt-2 block">NOVA lo trae.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
                Queremos traer productos que realmente necesites. Dinos qué buscas y tu solicitud ayudará a decidir nuestras próximas importaciones.
              </p>

              <div className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#82f000]">Próximas ideas</p>
                    <h2 className="mt-2 text-2xl font-black">Elige una o propón la tuya</h2>
                  </div>
                  <span className="hidden text-xs text-white/35 sm:block">Tú decides qué traer</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {productosPropuestos.map((item) => (
                    <article key={item.categoria} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111411] transition hover:-translate-y-1 hover:border-[#82f000]/40">
                      <div className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${item.tono}`}>
                        <div className="text-center">
                          <span className="text-3xl" aria-hidden="true">◇</span>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Foto próximamente</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#82f000]">{item.categoria}</span>
                        <h3 className="mt-2 text-sm font-black leading-5">{item.nombre}</h3>
                        <p className="mt-2 text-xs leading-5 text-white/40">{item.descripcion}</p>
                        <button
                          type="button"
                          onClick={() => elegirProducto(item.nombre, item.categoria)}
                          className="mt-4 w-full cursor-pointer rounded-lg border border-white/10 px-3 py-2.5 text-xs font-black transition hover:border-[#82f000] hover:bg-[#82f000] hover:text-black"
                        >
                          Lo quiero
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <button type="button" onClick={pedirOtroProducto} className="mt-4 w-full cursor-pointer rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm font-bold text-white/55 transition hover:border-[#82f000]/60 hover:text-[#82f000]">
                  No está aquí: quiero pedir otro producto →
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {["Cuéntanos", "Analizamos", "Te avisamos"].map((paso, indice) => (
                  <div key={paso} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <span className="text-xs font-black text-[#82f000]">0{indice + 1}</span>
                    <p className="mt-2 text-sm font-bold">{paso}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#111411]/95 p-6 shadow-2xl sm:p-9">
              <div className="border-b border-white/10 pb-7">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#82f000]">Tu solicitud</p>
                <h2 className="mt-3 text-3xl font-black">¿Qué debería traer NOVA?</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">Completa la idea y la prepararemos para enviarla por WhatsApp.</p>
              </div>

              <form ref={formularioRef} onSubmit={prepararSolicitud} className="mt-7 scroll-mt-28 space-y-6">
                <label className="block">
                  <span className="text-sm font-semibold text-white/70">Producto que buscas*</span>
                  <input
                    required
                    maxLength={120}
                    value={producto}
                    onChange={(event) => setProducto(event.target.value)}
                    placeholder="Ej. Organizador plegable para el hogar"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#82f000]/70 focus:ring-2 focus:ring-[#82f000]/10"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-white/70">Categoría*</span>
                    <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="mt-2 w-full cursor-pointer rounded-xl border border-white/10 bg-black px-4 py-3.5 text-white outline-none focus:border-[#82f000]/70">
                      <option>Hogar</option>
                      <option>Cacharrería</option>
                      <option>Piñatería</option>
                      <option>Mascotas</option>
                      <option>Motos</option>
                      <option>Otra</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-white/70">Cantidad aproximada*</span>
                    <input required type="number" min="1" max="10000" value={cantidad} onChange={(event) => setCantidad(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-white outline-none focus:border-[#82f000]/70" />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold text-white/70">¿Para quién lo necesitas?</legend>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {["Para mí", "Para mi negocio"].map((opcion) => (
                      <label key={opcion} className={`cursor-pointer rounded-xl border p-4 text-center text-sm font-bold transition ${uso === opcion ? "border-[#82f000] bg-[#82f000]/10 text-[#82f000]" : "border-white/10 bg-black text-white/55 hover:border-white/25"}`}>
                        <input type="radio" name="uso" value={opcion} checked={uso === opcion} onChange={() => setUso(opcion)} className="sr-only" />
                        {opcion}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="text-sm font-semibold text-white/70">Detalles adicionales</span>
                  <textarea value={detalles} onChange={(event) => setDetalles(event.target.value)} maxLength={500} rows={4} placeholder="Color, tamaño, referencia o precio que esperas..." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#82f000]/70 focus:ring-2 focus:ring-[#82f000]/10" />
                </label>

                <button type="submit" className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#82f000] px-6 py-4 font-black text-black shadow-[0_15px_40px_rgba(130,240,0,0.14)] transition hover:-translate-y-0.5 hover:bg-[#9cff35]">
                  Pedirle a NOVA
                  <span aria-hidden="true">→</span>
                </button>

                <p className="text-center text-xs leading-5 text-white/35">
                  Manifestar tu interés no genera una compra, reserva ni cobro. La disponibilidad, el precio y la fecha se confirmarán antes de cualquier pedido.
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
