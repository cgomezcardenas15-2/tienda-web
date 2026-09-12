import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function texto(valor: unknown, limite = 180) { return typeof valor === "string" ? valor.trim().slice(0, limite) : ""; }
function numero(valor: unknown) { const n = Number(valor); return Number.isFinite(n) && n >= 0 ? n : NaN; }
type LineaCompra = { descripcion: string; sku: string | null; cantidad: number; costo_unitario: number };

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const body = await request.json();
  const proveedorId = texto(body.proveedor_id, 50);
  const moneda = texto(body.moneda, 3);
  const productos: Record<string, unknown>[] = Array.isArray(body.productos) ? body.productos.slice(0, 200) : [];
  if (!proveedorId || !productos.length) return NextResponse.json({ error: "Agrega por lo menos un producto." }, { status: 400 });
  if (!["COP", "USD", "CNY", "EUR"].includes(moneda)) return NextResponse.json({ error: "La moneda no es válida." }, { status: 400 });
  const { data: proveedor } = await supabaseAdmin.from("proveedores").select("id, activo").eq("id", proveedorId).maybeSingle();
  if (!proveedor?.activo) return NextResponse.json({ error: "El proveedor no está activo." }, { status: 400 });

  const lineas: LineaCompra[] = productos.map((item) => ({ descripcion: texto(item.descripcion), sku: texto(item.sku, 100) || null, cantidad: Math.trunc(numero(item.cantidad)), costo_unitario: numero(item.costo_unitario) }));
  if (lineas.some(linea => !linea.descripcion || linea.cantidad < 1 || !Number.isFinite(linea.costo_unitario))) return NextResponse.json({ error: "Revisa el producto, la cantidad y el costo unitario." }, { status: 400 });
  const impuestos = numero(body.impuestos), costoEnvio = numero(body.costo_envio), otrosCostos = numero(body.otros_costos);
  if (![impuestos, costoEnvio, otrosCostos].every(Number.isFinite)) return NextResponse.json({ error: "Revisa los costos adicionales." }, { status: 400 });
  const subtotal = lineas.reduce((suma, linea) => suma + linea.cantidad * linea.costo_unitario, 0);
  const total = subtotal + impuestos + costoEnvio + otrosCostos;
  const { data: compra, error } = await supabaseAdmin.from("compras").insert({ proveedor_id: proveedorId, factura_proveedor: texto(body.factura_proveedor, 100) || null, fecha_compra: texto(body.fecha_compra, 10), estado: "borrador", moneda, subtotal, impuestos, costo_envio: costoEnvio, otros_costos: otrosCostos, total, notas: texto(body.notas, 2000) || null }).select("id, consecutivo").single();
  if (error || !compra) return NextResponse.json({ error: "No fue posible guardar la compra." }, { status: 400 });
  const { error: errorLineas } = await supabaseAdmin.from("productos_compra").insert(lineas.map(linea => ({ ...linea, compra_id: compra.id })));
  if (errorLineas) { await supabaseAdmin.from("compras").delete().eq("id", compra.id); return NextResponse.json({ error: "No fue posible guardar los productos de la compra." }, { status: 400 }); }
  return NextResponse.json({ ok: true, consecutivo: compra.consecutivo }, { status: 201 });
}
