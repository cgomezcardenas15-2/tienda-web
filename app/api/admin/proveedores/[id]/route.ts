import { NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function texto(valor: unknown, limite = 180) { return typeof valor === "string" ? valor.trim().slice(0, limite) : ""; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  if (typeof body.activo === "boolean" && Object.keys(body).length === 1) {
    const { error } = await supabaseAdmin.from("proveedores").update({ activo: body.activo, actualizado_en: new Date().toISOString() }).eq("id", id);
    return error ? NextResponse.json({ error: "No fue posible cambiar el estado." }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  const nombre = texto(body.nombre);
  const tipoDocumento = texto(body.tipo_documento, 10);
  const moneda = texto(body.moneda, 3);
  if (!nombre) return NextResponse.json({ error: "Escribe el nombre del proveedor." }, { status: 400 });
  if (!["NIT", "CC", "CE", "PAS", "OTRO"].includes(tipoDocumento)) return NextResponse.json({ error: "El tipo de documento no es válido." }, { status: 400 });
  if (!["COP", "USD", "CNY", "EUR"].includes(moneda)) return NextResponse.json({ error: "La moneda no es válida." }, { status: 400 });
  const sitioWeb = texto(body.sitio_web, 500);
  if (sitioWeb) { try { const url = new URL(sitioWeb); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "El sitio web no es válido." }, { status: 400 }); } }

  const { error } = await supabaseAdmin.from("proveedores").update({ nombre, tipo_documento: tipoDocumento, numero_documento: texto(body.numero_documento, 50) || null, persona_contacto: texto(body.persona_contacto) || null, correo: texto(body.correo, 254).toLowerCase() || null, telefono: texto(body.telefono, 40) || null, pais: texto(body.pais, 80) || "Colombia", ciudad: texto(body.ciudad, 100) || null, sitio_web: sitioWeb || null, moneda, notas: texto(body.notas, 2000) || null, actualizado_en: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Ya existe un proveedor con ese documento." : "No fue posible actualizar el proveedor." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
