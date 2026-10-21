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

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#82f000]">
              Buscar en NOVA
            </p>

            <h1 className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-5xl">
              {titulo}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
              {query ? "Buscamos por nombre, categoría, descripción, SKU, color y talla, incluso si escribes alguna letra incorrecta." : "Escribe lo que necesitas en el buscador para comenzar."}
            </p>
          </div>
        </section>
        {query ? <Products busqueda={query} /> : null}
      </main>

      <Footer />
    </>
  );
}
