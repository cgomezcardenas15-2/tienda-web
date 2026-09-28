import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Products from "../components/Products";

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
              {query ? "Revisa los productos que coinciden con tu búsqueda." : "Escribe lo que necesitas en el buscador para comenzar."}
            </p>
          </div>
        </section>
        {query ? <Products busqueda={query} /> : null}
      </main>

      <Footer />
    </>
  );
}
