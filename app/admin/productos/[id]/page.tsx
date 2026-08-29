import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import VariantesManager from "./VariantesManager";
import ProductoForm from "../ProductoForm";

export const dynamic = "force-dynamic";

export default async function ProductoVariantesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [{ data: producto }, { data: variantes, error }] = await Promise.all([
    supabaseAdmin.from("productos").select("id,nombre,sku,descripcion,categoria,precio,precio_anterior,controla_stock,stock,imagen_url,destacado,en_oferta,activo").eq("id", id).maybeSingle(),
    supabaseAdmin.from("variantes_producto").select("*").eq("producto_id", id).order("orden"),
  ]);
  if (!producto) notFound();
  return <main className="mx-auto max-w-5xl px-5 py-8">
    <Link href="/admin/productos" className="text-sm font-bold text-lime-400">← Volver a productos</Link>
    <h1 className="mt-5 text-3xl font-black">{producto.nombre}</h1>
    <p className="mt-2 text-sm text-zinc-400">Cada opción puede manejar su propia foto, precio y existencias.</p>
    <div className="mt-7"><ProductoForm producto={producto} /></div>
    {error ? <p className="mt-6 text-red-300">No fue posible cargar las variantes.</p> : <VariantesManager producto={producto} iniciales={variantes ?? []} />}
  </main>;
}
