import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ConsultaPedido from "./ConsultaPedido";

export const metadata: Metadata = { title: "Consulta tu pedido | NOVA", description: "Consulta de forma segura el estado y la guía de tu pedido NOVA." };

export default function ConsultarPedidoPage() {
  return <><Navbar /><main className="min-h-screen bg-[#080a08] px-6 py-14 text-white lg:px-10"><div className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.24em] text-[#82f000]">Seguimiento NOVA</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Consulta tu pedido</h1><p className="mt-4 max-w-2xl leading-7 text-white/50">Revisa el avance de tu compra y encuentra la guía cuando el pedido sea enviado.</p><div className="mt-8"><ConsultaPedido /></div></div></main><Footer /></>;
}
