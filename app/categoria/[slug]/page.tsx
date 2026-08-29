import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { CATEGORIAS_ACTIVAS } from "../../lib/categoriasActivas";

const categorias = {
  tecnologia: {
    nombre: "Tecnología y accesorios",
    icono: "⚡",
    descripcion:
      "Cables, cargadores, audífonos y accesorios prácticos para el día a día.",
  },

  pinateria: {
    nombre: "Piñatería",
    icono: "🎉",
    descripcion:
      "Todo lo que necesitas para celebrar cumpleaños y momentos especiales.",
  },

  hogar: {
    nombre: "Hogar",
    icono: "🏠",
    descripcion:
      "Productos prácticos para organizar, complementar y facilitar tu hogar.",
  },

  bebes: {
    nombre: "Bebés",
    icono: "🍼",
    descripcion:
      "Productos y accesorios pensados para el cuidado de los más pequeños.",
  },

  maquillaje: {
    nombre: "Maquillaje",
    icono: "💄",
    descripcion:
      "Productos y accesorios para complementar tu rutina de belleza.",
  },

  mascotas: {
    nombre: "Mascotas",
    icono: "🐾",
    descripcion:
      "Accesorios y productos prácticos para consentir a tus mascotas.",
  },

  ferreteria: {
    nombre: "Ferretería",
    icono: "🔧",
    descripcion:
      "Herramientas y soluciones útiles para reparaciones y tareas del día a día.",
  },
};

type CategoriaKey = keyof typeof categorias;

type CategoriaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoriaPage({
  params,
}: CategoriaPageProps) {
  const { slug } = await params;

  const categoria = categorias[slug as CategoriaKey];
  const categoriaEstaActiva = CATEGORIAS_ACTIVAS.includes(
    slug as (typeof CATEGORIAS_ACTIVAS)[number]
  );

  if (!categoria || !categoriaEstaActiva) {
    return (
      <>
        <Navbar />

        <main className="min-h-[70vh] bg-[#080a08] px-6 py-24 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#82f000]">
                NOVA
              </p>

              <h1 className="mt-4 text-4xl font-bold">
                Categoría no encontrada
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-white/60">
                Esta categoría no está disponible por el momento.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex rounded-xl bg-[#82f000] px-6 py-3 font-bold text-black transition hover:bg-[#9cff35]"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-[#82f000]/10 blur-[150px]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-[#82f000]"
            >
              <span>←</span>
              Volver al inicio
            </Link>

            <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-3xl">
                  {categoria.icono}
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#82f000]">
                  Categoría NOVA
                </p>

                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  {categoria.nombre}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                  {categoria.descripcion}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82f000]">
                  NOVA
                </p>

                <p className="mt-2 text-sm text-white/60">
                  Todo lo que necesitas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-10">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#82f000]">
                Próximamente
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Estamos preparando esta categoría
              </h2>

              <p className="mt-4 leading-7 text-white/55">
                Aquí aparecerán los productos disponibles de{" "}
                <span className="font-semibold text-white">
                  {categoria.nombre}
                </span>
                . Cuando tengamos las fotografías y el catálogo real,
                agregaremos los productos sin tener que reconstruir esta página.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
