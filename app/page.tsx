import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import Products from "./components/Products";
import Footer from "./components/Footer";
import LoQuieroPromo from "./components/LoQuieroPromo";

type HomeProps = {
  searchParams: Promise<{
    ofertas?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const mostrarOfertas = params.ofertas === "1";

  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <LoQuieroPromo />
      <Products key={mostrarOfertas ? "ofertas" : "destacados"} ofertas={mostrarOfertas} />
      <Footer />
    </>
  );
}
