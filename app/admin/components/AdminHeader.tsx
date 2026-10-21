import Link from "next/link";

const enlaces = [
  ["/admin/pedidos", "Pedidos"],
  ["/admin/conciliacion", "Pagos"],
  ["/admin/devoluciones", "Devoluciones"],
  ["/admin/clientes", "Clientes"],
  ["/admin/resumen", "Resumen"],
  ["/admin/caja", "Caja"],
  ["/admin/compras", "Compras"],
  ["/admin/comisiones", "Comisiones"],
  ["/admin/productos", "Productos"],
  ["/admin/categorias", "Categorías"],
  ["/admin/inventario", "Inventario"],
  ["/admin/envios", "Envíos"],
  ["/admin/configuracion", "Configuración"],
  ["/consultar-pedido", "Consulta pública"],
] as const;

const claseEnlace = "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-lime-300";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0 shrink-0">
          <Link href="/admin/pedidos" className="block truncate text-lg font-black tracking-[0.18em] text-white sm:text-xl sm:tracking-[0.24em]">
            NOVA <span className="text-lime-400">ADMIN</span>
          </Link>
          <p className="mt-1 hidden text-xs text-zinc-500 sm:block">Gestión privada de la tienda</p>
        </div>

        <nav aria-label="Administración" className="ml-auto hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex">
          {enlaces.map(([href, texto]) => (
            <Link key={href} href={href} className={`${claseEnlace} shrink-0`}>
              {texto}
            </Link>
          ))}
        </nav>

        <form action="/api/admin/logout" method="post" className="hidden shrink-0 lg:block">
          <button className="min-h-11 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-lime-400 hover:text-white">
            Cerrar sesión
          </button>
        </form>

        <details className="relative ml-auto lg:hidden">
          <summary className="flex min-h-11 list-none items-center gap-2 rounded-xl border border-zinc-700 px-4 text-sm font-black text-white [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-lg">☰</span>
            Menú
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 max-h-[min(72vh,560px)] w-[min(88vw,330px)] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">
            <nav aria-label="Menú de administración para celular" className="grid grid-cols-2 gap-1">
              {enlaces.map(([href, texto]) => (
                <Link key={href} href={href} className={claseEnlace}>
                  {texto}
                </Link>
              ))}
            </nav>
            <form action="/api/admin/logout" method="post" className="mt-2 border-t border-zinc-800 pt-2">
              <button className="min-h-11 w-full rounded-xl border border-zinc-700 px-4 text-left text-sm font-semibold text-zinc-300 hover:border-red-400 hover:text-white">
                Cerrar sesión
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
