"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const router = useRouter();

  const { cantidadTotal } = useCart();

  const [searchDesktop, setSearchDesktop] = useState("");
  const [searchMobile, setSearchMobile] = useState("");

  function buscarProducto(
    event: FormEvent<HTMLFormElement>,
    termino: string
  ) {
    event.preventDefault();

    const busqueda = termino.trim();

    if (busqueda === "") {
      return;
    }

    router.push("/buscar?q=" + encodeURIComponent(busqueda));
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070907]/95 text-white shadow-xl backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Logo */}
          <a
            href="/"
            className="flex shrink-0 cursor-pointer items-center gap-3"
            aria-label="Ir al inicio de NOVA"
          >
            <img
              src="/nova-symbol.png"
              alt="Símbolo de NOVA"
              className="h-11 w-11 object-contain"
            />

            <div className="hidden sm:block">
              <p className="text-2xl font-black tracking-[0.22em] text-white">
                NOVA
              </p>

              <p className="mt-0.5 text-[10px] font-medium tracking-[0.08em] text-lime-400">
                TODO LO QUE NECESITAS
              </p>
            </div>
          </a>

          {/* Buscador escritorio */}
          <form
            onSubmit={(event) => buscarProducto(event, searchDesktop)}
            className="hidden flex-1 md:flex"
          >
            <div className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] transition focus-within:border-lime-400/70 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-lime-400/10">
              <div className="flex items-center pl-4 text-zinc-500">
                <SearchIcon />
              </div>

              <input
                type="search"
                value={searchDesktop}
                onChange={(event) => setSearchDesktop(event.target.value)}
                placeholder="¿Qué necesitas encontrar hoy?"
                aria-label="Buscar productos"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-zinc-500"
              />

              <button
                type="submit"
                className="m-1.5 cursor-pointer rounded-lg bg-lime-400 px-6 text-sm font-bold text-zinc-950 transition hover:bg-lime-300"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Acciones */}
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="hidden cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-300 transition hover:bg-white/[0.06] hover:text-lime-400 lg:flex"
            >
              <HeartIcon />

              <span className="text-sm font-medium">
                Favoritos
              </span>
            </button>

            <button
              type="button"
              className="hidden cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-300 transition hover:bg-white/[0.06] hover:text-lime-400 lg:flex"
            >
              <UserIcon />

              <span className="text-sm font-medium">
                Mi cuenta
              </span>
            </button>

            {/* Carrito */}
            <a
              href="/carrito"
              className="relative flex cursor-pointer items-center gap-2 rounded-xl bg-lime-400 px-3.5 py-3 font-bold text-zinc-950 shadow-[0_8px_28px_rgba(163,230,53,0.16)] transition hover:-translate-y-0.5 hover:bg-lime-300 sm:px-4"
              aria-label="Abrir carrito"
            >
              <CartIcon />

              <span className="hidden text-sm font-semibold sm:inline">
                Carrito
              </span>

              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {cantidadTotal}
              </span>
            </a>
          </nav>
        </div>

        {/* Buscador móvil */}
        <form
          onSubmit={(event) => buscarProducto(event, searchMobile)}
          className="mt-4 md:hidden"
        >
          <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
            <div className="flex items-center pl-4 text-zinc-500">
              <SearchIcon />
            </div>

            <input
              type="search"
              value={searchMobile}
              onChange={(event) => setSearchMobile(event.target.value)}
              placeholder="Buscar productos"
              aria-label="Buscar productos"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <button
              type="submit"
              className="m-1.5 cursor-pointer rounded-lg bg-lime-400 px-4 font-bold text-zinc-950"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Categorías */}
        <div className="mt-4 flex items-center gap-6 overflow-x-auto border-t border-white/10 pt-4 text-sm font-medium text-zinc-400">
          <a
            href="/"
            className="cursor-pointer whitespace-nowrap font-semibold text-lime-400"
          >
            Inicio
          </a>

          <a
            href="/categoria/tecnologia"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Tecnología
          </a>

          <a
            href="/categoria/pinateria"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Piñatería
          </a>

          <a
            href="/categoria/hogar"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Hogar
          </a>

          <a
            href="/categoria/bebes"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Bebés
          </a>

          <a
            href="/categoria/maquillaje"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Maquillaje
          </a>

          <a
            href="/categoria/mascotas"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Mascotas
          </a>

          <a
            href="/categoria/ferreteria"
            className="cursor-pointer whitespace-nowrap transition hover:text-white"
          >
            Ferretería
          </a>

          <a
            href="/#productos"
            className="ml-auto cursor-pointer whitespace-nowrap font-bold text-orange-400 transition hover:text-orange-300"
          >
            Ofertas
          </a>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}