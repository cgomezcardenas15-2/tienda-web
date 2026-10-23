import { requireAdmin } from "@/app/lib/adminAuth";
import {
  type ConfiguracionTienda,
  obtenerConfiguracionTienda,
} from "@/app/lib/configuracionTienda";
import Link from "next/link";
import ConfiguracionForm from "./ConfiguracionForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requireAdmin();
  let configuracion: ConfiguracionTienda;

  try {
    configuracion = await obtenerConfiguracionTienda();
  } catch (error) {
    console.error("No fue posible abrir la configuración administrativa:", error);
    return <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">AJUSTES DE LA TIENDA</p>
      <h1 className="mt-2 text-3xl font-black">Configuración</h1>
      <div role="alert" className="mt-8 max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="text-lg font-black text-red-200">No pudimos leer la configuración</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">No se mostró ningún control para evitar cambiar o desactivar datos por error. Reintenta cuando la conexión esté disponible.</p>
        <Link href="/admin/configuracion" className="mt-5 inline-flex rounded-xl bg-lime-400 px-5 py-3 font-black text-black hover:bg-lime-300">Reintentar</Link>
      </div>
    </main>;
  }

  return <main className="mx-auto max-w-7xl px-5 py-10">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">AJUSTES DE LA TIENDA</p>
    <h1 className="mt-2 text-3xl font-black">Configuración</h1>
    <p className="mt-2 text-sm text-zinc-400">Controla las condiciones generales de compra desde el administrador.</p>
    <div className="mt-8 max-w-2xl"><ConfiguracionForm configuracion={configuracion} /></div>
  </main>;
}
