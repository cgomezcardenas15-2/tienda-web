import Link from "next/link";

export default function AdminHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <div>
          <Link href="/admin/pedidos" className="text-xl font-black tracking-[0.24em] text-white">
            NOVA <span className="text-lime-400">ADMIN</span>
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Gestión privada de la tienda</p>
        </div>
        <nav aria-label="Administración" className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto sm:gap-2">
          <Link href="/admin/pedidos" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 hover:text-lime-300">Pedidos</Link>
          <Link href="/admin/productos" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 hover:text-lime-300">Productos</Link>
          <Link href="/admin/inventario" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 hover:text-lime-300">Inventario</Link>
          <Link href="/admin/envios" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 hover:text-lime-300">Envíos</Link>
          <Link href="/consultar-pedido" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 hover:text-lime-300">Consulta pública</Link>
        </nav>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-lime-400 hover:text-white">
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
