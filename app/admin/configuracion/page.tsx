import { requireAdmin } from "@/app/lib/adminAuth";
import { obtenerConfiguracionTienda } from "@/app/lib/configuracionTienda";
import ConfiguracionForm from "./ConfiguracionForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const configuracion = await obtenerConfiguracionTienda();
  return <main className="mx-auto max-w-5xl px-5 py-8">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">AJUSTES DE LA TIENDA</p>
    <h1 className="mt-2 text-3xl font-black">Configuración</h1>
    <p className="mt-2 text-sm text-zinc-400">Controla las condiciones generales de compra desde el administrador.</p>
    <div className="mt-7"><ConfiguracionForm configuracion={configuracion} /></div>
  </main>;
}
