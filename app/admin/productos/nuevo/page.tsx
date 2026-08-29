import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import ProductoForm from "../ProductoForm";

export default async function NuevoProductoPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/admin/productos" className="text-sm font-bold text-lime-400">← Volver a productos</Link>
      <h1 className="mt-5 text-3xl font-black">Nuevo producto</h1>
      <p className="mt-2 text-sm text-zinc-400">Crea la ficha principal. Después podrás agregar colores, tallas u otras opciones.</p>
      <div className="mt-7"><ProductoForm /></div>
    </main>
  );
}
