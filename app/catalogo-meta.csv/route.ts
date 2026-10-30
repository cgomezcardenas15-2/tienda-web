import { construirCatalogoMeta } from "@/app/lib/catalogoMeta";
import { consultarTodosSupabase } from "@/app/lib/consultarTodosSupabase";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [resultadoProductos, resultadoVariantes, resultadoCategorias] = await Promise.all([
      consultarTodosSupabase((desde, hasta) =>
        supabaseAdmin
          .from("productos")
          .select(
            "id,sku,nombre,descripcion,categoria,precio,controla_stock,stock,imagen_url,activo",
            { count: "exact" },
          )
          .eq("activo", true)
          .order("id")
          .range(desde, hasta),
      ),
      consultarTodosSupabase((desde, hasta) =>
        supabaseAdmin
          .from("variantes_producto")
          .select(
            "id,producto_id,nombre,color,talla,sku,precio,controla_stock,stock,imagen_url,activo,orden",
            { count: "exact" },
          )
          .eq("activo", true)
          .order("id")
          .range(desde, hasta),
      ),
      supabaseAdmin
        .from("categorias_producto")
        .select("nombre,activo")
        .eq("activo", true)
        .order("orden")
        .order("nombre"),
    ]);

    const error = resultadoProductos.error || resultadoVariantes.error || resultadoCategorias.error;
    if (error) throw error;

    const catalogo = construirCatalogoMeta({
      productos: resultadoProductos.data ?? [],
      variantes: resultadoVariantes.data ?? [],
      categorias: resultadoCategorias.data ?? [],
    });

    console.info("Catálogo Meta generado", {
      total: catalogo.total,
      omitidosSinImagen: catalogo.omitidosSinImagen,
      omitidosSinDescripcion: catalogo.omitidosSinDescripcion,
      omitidosPrecioInvalido: catalogo.omitidosPrecioInvalido,
    });

    return new Response(catalogo.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'inline; filename="catalogo-meta-nova.csv"',
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
        "X-NOVA-Catalog-Items": String(catalogo.total),
      },
    });
  } catch (error) {
    console.error("No fue posible generar el catálogo Meta:", error);
    return new Response("No fue posible generar el catálogo en este momento.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
