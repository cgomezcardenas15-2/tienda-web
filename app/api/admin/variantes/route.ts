import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

function limpiar(body: Record<string, unknown>) {
  const texto = (v:unknown) => typeof v === "string" ? v.trim() : "";
  const precioTexto = texto(body.precio);
  return { producto_id:texto(body.productoId), nombre:texto(body.nombre), color:texto(body.color)||null, talla:texto(body.talla)||null, sku:texto(body.sku), precio:precioTexto === "" ? null : Number(precioTexto), controla_stock:true, stock:Number(body.stock), imagen_url:texto(body.imagen_url)||null, activo:body.activo !== false };
}
export async function POST(request:NextRequest){
  if(request.headers.get("origin")!==request.nextUrl.origin) return NextResponse.json({error:"Solicitud no permitida."},{status:403});
  if(!await getAdminSession()) return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const body=await request.json().catch(()=>null); if(!body) return NextResponse.json({error:"Datos no válidos."},{status:400});
  const datos=limpiar(body); if(!datos.producto_id||!datos.nombre||!datos.sku||!Number.isInteger(datos.stock)||datos.stock<0||datos.precio!==null&&(!Number.isInteger(datos.precio)||datos.precio<0)) return NextResponse.json({error:"Completa nombre, SKU, precio y stock correctamente."},{status:400});
  const {data,error}=await supabaseAdmin.from("variantes_producto").insert(datos).select("*").single();
  if(error){console.error("Error creando variante:",{code:error.code,message:error.message}); return NextResponse.json({error:error.code==="23505"?"Ese SKU ya está utilizado.":"No fue posible crear la variante."},{status:409});}
  return NextResponse.json({ok:true,variante:data},{status:201});
}
