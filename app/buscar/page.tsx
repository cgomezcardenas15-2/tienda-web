import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  const titulo = query
    ? 'Resultados para "' + query + '"'
    : "Encuentra lo que necesitas";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#080a08] text-white">
        {/* Encabezado */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-[#82f000]/10 blur-[150px]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              Buscar en NOVA
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {titulo}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
              {query
                ? "Estamos preparando el catálogo para mostrarte resultados reales y útiles."
                : "Escribe lo que necesitas en el buscador para comenzar."}
            </p>
          </div>
        </section>

        {/* Contenido temporal */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#82f000]/30 bg-[#82f000]/10 text-xl text-[#82f000]">
                🔎
              </span>

              <h2 className="mt-6 text-2xl font-semibold sm:text-3xl">
                Buscador preparado
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                Esta página ya está preparada para recibir las búsquedas de
                NOVA. Cuando carguemos el catálogo real, aquí aparecerán los
                productos relacionados con lo que escriba la persona.
              </p>

              {query !== "" && (
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                    Búsqueda actual
                  </p>

                  <p className="mt-2 text-lg font-semibold text-[#82f000]">
                    {query}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}