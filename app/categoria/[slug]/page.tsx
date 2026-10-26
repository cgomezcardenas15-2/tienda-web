import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Products from "../../components/Products";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { CATEGORIAS_PREDETERMINADAS } from "../../lib/categoriasProducto";

type CategoriaPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    subcategoria?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function CategoriaPage({
  params,
  searchParams,
}: CategoriaPageProps) {
  const { slug } = await params;
  const parametros = await searchParams;
  const slugSubcategoria = Array.isArray(parametros.subcategoria)
    ? parametros.subcategoria[0]
    : parametros.subcategoria;

  const { data, error } = await supabaseAdmin.from("categorias_producto").select("id,nombre,slug,descripcion,icono").eq("slug", slug).eq("activo", true).maybeSingle();
  const categoria = data ?? (error ? CATEGORIAS_PREDETERMINADAS.find((item) => item.slug === slug) : null);

  if (!categoria) {
    return (
      <>
        <Navbar />

        <main className="min-h-[70vh] bg-[#080a08] px-4 py-14 text-white sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#82f000]">
                NOVA
              </p>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
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

  const { data: subcategorias } = data
    ? await supabaseAdmin
      .from("subcategorias_producto")
      .select("id,nombre,slug,descripcion")
      .eq("categoria_id", data.id)
      .eq("activo", true)
      .order("orden")
      .order("nombre")
    : { data: [] };
  const subcategoriasDisponibles = subcategorias ?? [];
  const subcategoriaSeleccionada = subcategoriasDisponibles.find((item) => item.slug === slugSubcategoria) ?? null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-[#82f000]/10 blur-[150px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-[#82f000]"
            >
              <span>←</span>
              Volver al inicio
            </Link>

            <div className="mt-8 grid items-end gap-8 sm:mt-10 lg:grid-cols-[1fr_auto] lg:gap-10">
              <div className="max-w-3xl">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-3xl">
                  {categoria.icono}
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#82f000]">
                  Categoría NOVA
                </p>

                <h1 className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
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

        {subcategoriasDisponibles.length > 0 && (
          <section className="border-b border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Explorar dentro de {categoria.nombre}</p>
              <nav aria-label={`Subcategorías de ${categoria.nombre}`} className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">
                <Link
                  href={`/categoria/${categoria.slug}`}
                  aria-current={!subcategoriaSeleccionada ? "page" : undefined}
                  className={`min-h-11 shrink-0 snap-start rounded-xl border px-4 py-2.5 text-sm font-black transition ${!subcategoriaSeleccionada ? "border-[#82f000] bg-[#82f000] text-black" : "border-white/15 text-white/70 hover:border-[#82f000]/60 hover:text-[#9cff35]"}`}
                >
                  Todos
                </Link>
                {subcategoriasDisponibles.map((subcategoria) => {
                  const activa = subcategoria.id === subcategoriaSeleccionada?.id;
                  return (
                    <Link
                      key={subcategoria.id}
                      href={`/categoria/${categoria.slug}?subcategoria=${encodeURIComponent(subcategoria.slug)}`}
                      aria-current={activa ? "page" : undefined}
                      title={subcategoria.descripcion || undefined}
                      className={`min-h-11 shrink-0 snap-start rounded-xl border px-4 py-2.5 text-sm font-black transition ${activa ? "border-[#82f000] bg-[#82f000] text-black" : "border-white/15 text-white/70 hover:border-[#82f000]/60 hover:text-[#9cff35]"}`}
                    >
                      {subcategoria.nombre}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </section>
        )}

        <Products
          key={`${categoria.slug}:${subcategoriaSeleccionada?.id ?? "todas"}`}
          categoria={categoria.nombre}
          subcategoriaId={subcategoriaSeleccionada?.id}
          subcategoriaNombre={subcategoriaSeleccionada?.nombre}
        />
      </main>

      <Footer />
    </>
  );
}
