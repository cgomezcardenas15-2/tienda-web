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
        <section className="relative isolate overflow-hidden border-b border-white/10 pb-10 sm:pb-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(130,240,0,0.16),transparent_34%),radial-gradient(circle_at_8%_88%,rgba(130,240,0,0.07),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-14">
            <Link
              href="/"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 text-sm font-bold text-white/60 backdrop-blur transition hover:border-[#82f000]/50 hover:text-[#9cff35]"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              Volver al inicio
            </Link>

            <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(125deg,rgba(28,33,28,.96),rgba(10,13,10,.94)_56%,rgba(18,31,11,.92))] shadow-[0_28px_90px_rgba(0,0,0,.45)] sm:mt-8">
              <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-[#82f000]/20" />
              <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-[#82f000]/15" />

              <div className="relative grid lg:grid-cols-[1.35fr_.65fr]">
                <div className="p-6 sm:p-9 lg:p-12">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#82f000]/35 bg-[#82f000]/10 text-3xl shadow-[0_0_35px_rgba(130,240,0,.12)] sm:h-20 sm:w-20 sm:text-4xl">
                      {categoria.icono}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#82f000]/25 bg-[#82f000]/10 px-3 py-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#82f000] shadow-[0_0_12px_#82f000]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9cff35]">Categoría NOVA</span>
                      </div>
                    </div>
                  </div>

                  <h1 className="mt-7 break-words text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                    {categoria.nombre}
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                    {categoria.descripcion}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2">Catálogo organizado</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2">
                      {subcategoriasDisponibles.length > 0
                        ? `${subcategoriasDisponibles.length} ${subcategoriasDisponibles.length === 1 ? "sección" : "secciones"} para explorar`
                        : "Todos los productos en un lugar"}
                    </span>
                  </div>
                </div>

                <div className="relative hidden min-h-[310px] overflow-hidden border-l border-white/10 bg-black/20 lg:flex lg:items-center lg:justify-center">
                  <div className="absolute h-56 w-56 rounded-full border border-[#82f000]/15 bg-[#82f000]/[0.035]" />
                  <div className="absolute h-40 w-40 rounded-full border border-[#82f000]/25" />
                  <div className="relative text-8xl drop-shadow-[0_18px_30px_rgba(0,0,0,.45)]">{categoria.icono}</div>

                  <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#82f000]">Explora a tu manera</p>
                    <p className="mt-1.5 text-sm font-semibold text-white/70">
                      Elige una sección y encuentra más rápido lo que buscas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {subcategoriasDisponibles.length > 0 && (
          <section className="relative z-10 border-b border-white/10 bg-[#080a08]">
            <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-10">
              <div className="-mt-8 rounded-[1.75rem] border border-white/10 bg-[#111411]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,.48)] backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#82f000]">Explora {categoria.nombre}</p>
                    <h2 className="mt-1.5 text-xl font-black sm:text-2xl">¿Qué estás buscando?</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/45">
                    {subcategoriasDisponibles.length} {subcategoriasDisponibles.length === 1 ? "subcategoría" : "subcategorías"}
                  </span>
                </div>

                <nav aria-label={`Subcategorías de ${categoria.nombre}`} className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                  <Link
                    href={`/categoria/${categoria.slug}`}
                    aria-current={!subcategoriaSeleccionada ? "page" : undefined}
                    className={`group flex min-h-32 min-w-[210px] shrink-0 snap-start flex-col justify-between rounded-2xl border p-4 transition sm:min-w-[230px] ${!subcategoriaSeleccionada ? "border-[#82f000] bg-[linear-gradient(135deg,#9cff35,#72dc00)] text-black shadow-[0_12px_35px_rgba(130,240,0,.18)]" : "border-white/10 bg-white/[0.035] text-white hover:-translate-y-1 hover:border-[#82f000]/45 hover:bg-[#82f000]/[0.06]"}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${!subcategoriaSeleccionada ? "text-black/55" : "text-[#82f000]"}`}>Catálogo completo</span>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${!subcategoriaSeleccionada ? "border-black/15 bg-black/10" : "border-white/10 bg-black/25 group-hover:border-[#82f000]/40"}`}>
                        {!subcategoriaSeleccionada ? "✓" : "→"}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-black">Todos</p>
                      <p className={`mt-1 text-xs ${!subcategoriaSeleccionada ? "text-black/60" : "text-white/45"}`}>Ver todos los productos de {categoria.nombre}</p>
                    </div>
                  </Link>

                  {subcategoriasDisponibles.map((subcategoria) => {
                    const activa = subcategoria.id === subcategoriaSeleccionada?.id;
                    return (
                      <Link
                        key={subcategoria.id}
                        href={`/categoria/${categoria.slug}?subcategoria=${encodeURIComponent(subcategoria.slug)}`}
                        aria-current={activa ? "page" : undefined}
                        title={subcategoria.descripcion || undefined}
                        className={`group flex min-h-32 min-w-[210px] shrink-0 snap-start flex-col justify-between rounded-2xl border p-4 transition sm:min-w-[230px] ${activa ? "border-[#82f000] bg-[linear-gradient(135deg,#9cff35,#72dc00)] text-black shadow-[0_12px_35px_rgba(130,240,0,.18)]" : "border-white/10 bg-white/[0.035] text-white hover:-translate-y-1 hover:border-[#82f000]/45 hover:bg-[#82f000]/[0.06]"}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activa ? "text-black/55" : "text-[#82f000]"}`}>Subcategoría</span>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${activa ? "border-black/15 bg-black/10" : "border-white/10 bg-black/25 group-hover:border-[#82f000]/40"}`}>
                            {activa ? "✓" : "→"}
                          </span>
                        </div>
                        <div>
                          <p className="break-words text-lg font-black">{subcategoria.nombre}</p>
                          <p className={`mt-1 h-8 overflow-hidden text-xs leading-4 ${activa ? "text-black/60" : "text-white/45"}`}>
                            {subcategoria.descripcion || `Explorar productos de ${subcategoria.nombre}`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
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
