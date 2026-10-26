import Link from "next/link";
import { requireAdmin } from "@/app/lib/adminAuth";
import ProductoForm from "../ProductoForm";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { CATEGORIAS_PREDETERMINADAS } from "@/app/lib/categoriasProducto";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  await requireAdmin();
  const [consultaCategorias, consultaSubcategorias] = await Promise.all([
    supabaseAdmin.from("categorias_producto").select("id,nombre,activo").order("orden"),
    supabaseAdmin.from("subcategorias_producto").select("id,categoria_id,nombre,activo").order("orden").order("nombre"),
  ]);
  const opcionesCategorias = consultaCategorias.error
    ? CATEGORIAS_PREDETERMINADAS
    : (consultaCategorias.data ?? []).filter((categoria) => categoria.activo);
  const opcionesSubcategorias = consultaSubcategorias.error
    ? []
    : (consultaSubcategorias.data ?? []).filter((subcategoria) => subcategoria.activo);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/admin/productos" className="text-sm font-bold text-lime-400">← Volver a productos</Link>
      <h1 className="mt-5 text-3xl font-black">Nuevo producto</h1>
      <p className="mt-2 text-sm text-zinc-400">Crea la ficha principal y, si aplica, define desde aquí los colores con sus existencias.</p>
      <div className="mt-7"><ProductoForm categorias={opcionesCategorias} subcategorias={opcionesSubcategorias} /></div>
    </main>
  );
}
