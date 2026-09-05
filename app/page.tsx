import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import Products from "./components/Products";
import Footer from "./components/Footer";
import LoQuieroPromo from "./components/LoQuieroPromo";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <LoQuieroPromo />
      <Products />
      <Footer />
    </>
  );
}
