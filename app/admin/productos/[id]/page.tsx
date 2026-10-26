import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import VariantesManager from "./VariantesManager";
import ProductoForm from "../ProductoForm";
import { CATEGORIAS_PREDETERMINADAS } from "@/app/lib/categoriasProducto";

export const dynamic = "force-dynamic";

export default async function ProductoVariantesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [
    { data: producto },
    { data: variantes, error },
    { data: categorias, error: errorCategorias },
    { data: subcategorias, error: errorSubcategorias },
  ] = await Promise.all([
    supabaseAdmin.from("productos").select("id,nombre,sku,descripcion,categoria,subcategoria_id,precio,precio_anterior,venta_mayorista,precio_mayorista,cantidad_minima_mayorista,controla_stock,stock,imagen_url,destacado,en_oferta,activo").eq("id", id).maybeSingle(),
    supabaseAdmin.from("variantes_producto").select("*").eq("producto_id", id).order("orden"),
    supabaseAdmin.from("categorias_producto").select("id,nombre,activo").order("orden"),
    supabaseAdmin.from("subcategorias_producto").select("id,categoria_id,nombre,activo").order("orden").order("nombre"),
  ]);
  if (!producto) notFound();
  const opcionesCategorias = errorCategorias
    ? CATEGORIAS_PREDETERMINADAS
    : (categorias ?? []).filter((categoria) => categoria.activo || categoria.nombre === producto.categoria);
  const opcionesSubcategorias = errorSubcategorias
    ? []
    : (subcategorias ?? []).filter((subcategoria) => subcategoria.activo || subcategoria.id === producto.subcategoria_id);
  const cantidadVariantes = (variantes ?? []).length;

  return <main className="mx-auto max-w-5xl px-5 py-8">
    <Link href="/admin/productos" className="text-sm font-bold text-lime-400">← Volver a productos</Link>
    <h1 className="mt-5 text-3xl font-black">{producto.nombre}</h1>
    <p className="mt-2 text-sm text-zinc-400">Configura los colores, tallas u otras opciones. Cada una puede manejar su propia foto, precio y existencias.</p>
    <div className="mt-7"><ProductoForm key={`${producto.id}-${producto.stock}-${producto.subcategoria_id ?? "sin-subcategoria"}-${cantidadVariantes}`} producto={producto} categorias={opcionesCategorias} subcategorias={opcionesSubcategorias} tieneVariantes={cantidadVariantes > 0} /></div>
    {error ? <p className="mt-6 text-red-300">No fue posible cargar las variantes.</p> : <VariantesManager producto={producto} iniciales={variantes ?? []} />}
  </main>;
}
