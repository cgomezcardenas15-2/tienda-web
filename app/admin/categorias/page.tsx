import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import CategoriasManager from "./CategoriasManager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  await requireAdmin();
  const [{ data: categorias, error }, { data: productos }] = await Promise.all([
    supabaseAdmin.from("categorias_producto").select("id,nombre,slug,descripcion,icono,activo,orden").order("orden").order("nombre"),
    supabaseAdmin.from("productos").select("categoria"),
  ]);

  const conteos = new Map<string, number>();
  for (const producto of productos ?? []) conteos.set(producto.categoria, (conteos.get(producto.categoria) ?? 0) + 1);

  return <main className="mx-auto max-w-6xl px-5 py-8">
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-lime-400">Organización de la tienda</p>
    <h1 className="mt-2 text-3xl font-black">Categorías</h1>
    <p className="mt-2 max-w-2xl text-sm text-zinc-400">Crea, edita, ordena o desactiva secciones. Al desactivar una categoría, sus productos se conservan pero dejan de mostrarse al público.</p>
    {error ? <p className="mt-7 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-200">Primero falta activar el módulo de categorías en la base de datos.</p> : <CategoriasManager iniciales={(categorias ?? []).map((categoria) => ({ ...categoria, productos: conteos.get(categoria.nombre) ?? 0 }))} />}
  </main>;
}

