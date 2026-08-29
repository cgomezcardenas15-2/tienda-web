import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { crearCsv, respuestaCsv } from "@/app/lib/csv";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "La sesión administrativa expiró." }, { status: 401 });
  const [{ data: productos, error }, { data: variantes, error: errorVariantes }] = await Promise.all([
    supabaseAdmin.from("productos").select("id,nombre,sku,categoria,precio,precio_anterior,stock,controla_stock,activo,en_oferta,destacado,imagen_url").order("nombre"),
    supabaseAdmin.from("variantes_producto").select("producto_id,nombre,color,talla,sku,precio,stock,controla_stock,activo,imagen_url").order("producto_id").order("orden"),
  ]);
  if (error || errorVariantes) {
    console.error("Error exportando inventario:", error?.message || errorVariantes?.message);
    return NextResponse.json({ error: "No fue posible exportar el inventario." }, { status: 500 });
  }

  const productoPorId = new Map((productos ?? []).map((producto) => [producto.id, producto]));
  const filas: unknown[][] = [];
  for (const producto of productos ?? []) filas.push([
    "Producto", producto.nombre, "", "", producto.sku, producto.categoria, producto.precio,
    producto.precio_anterior, producto.stock, producto.controla_stock ? "Sí" : "No",
    producto.activo ? "Visible" : "Suspendido", producto.en_oferta ? "Sí" : "No",
    producto.destacado ? "Sí" : "No", producto.imagen_url,
  ]);
  for (const variante of variantes ?? []) {
    const producto = productoPorId.get(variante.producto_id);
    filas.push(["Variante", producto?.nombre || "Producto no encontrado", variante.nombre, variante.color,
      variante.sku, producto?.categoria, variante.precio ?? producto?.precio, "", variante.stock,
      variante.controla_stock ? "Sí" : "No", variante.activo ? "Visible" : "Suspendida", "", "", variante.imagen_url]);
  }
  const encabezados = ["Tipo","Producto","Variante","Color/talla","SKU","Categoría","Precio","Precio anterior","Stock","Controla stock","Estado","Oferta","Destacado","Imagen"];
  return respuestaCsv(crearCsv(encabezados, filas), `nova-inventario-${new Date().toISOString().slice(0, 10)}.csv`);
}
