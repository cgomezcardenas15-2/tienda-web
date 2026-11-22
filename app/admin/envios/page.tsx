import { requireAdmin } from "@/app/lib/adminAuth";
import EnviosForm from "./EnviosForm";

export const dynamic = "force-dynamic";

export default async function EnviosAdminPage() {
  await requireAdmin();
  return <main className="mx-auto max-w-5xl px-5 py-8">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">OPERACIÓN</p>
    <h1 className="mt-2 text-3xl font-black">Condiciones de envío</h1>
    <p className="mt-2 text-sm text-zinc-400">Consulta cómo se cobra el domicilio en los pedidos nuevos.</p>
    <div className="mt-7"><EnviosForm /></div>
  </main>;
}
