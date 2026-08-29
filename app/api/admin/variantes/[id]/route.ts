import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

async function autorizado(request:NextRequest){return request.headers.get("origin")===request.nextUrl.origin&&Boolean(await getAdminSession());}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!await autorizado(request)) return NextResponse.json({error:"Sesión o solicitud no válida."},{status:401});
  const {id}=await params; const b=await request.json().catch(()=>null); if(!b)return NextResponse.json({error:"Datos no válidos."},{status:400});
  const t=(v:unknown)=>typeof v==="string"?v.trim():""; const precio=t(b.precio)===""?null:Number(t(b.precio)); const stock=Number(b.stock);
  if(!t(b.nombre)||!t(b.sku)||!Number.isInteger(stock)||stock<0||precio!==null&&(!Number.isInteger(precio)||precio<0))return NextResponse.json({error:"Revisa nombre, SKU, precio y stock."},{status:400});
  const cambios={nombre:t(b.nombre),color:t(b.color)||null,talla:t(b.talla)||null,sku:t(b.sku),precio,controla_stock:true,stock,imagen_url:t(b.imagen_url)||null,activo:b.activo!==false,actualizado_en:new Date().toISOString()};
  const {data,error}=await supabaseAdmin.from("variantes_producto").update(cambios).eq("id",id).select("*").single();
  if(error)return NextResponse.json({error:error.code==="23505"?"Ese SKU ya está utilizado.":"No fue posible actualizar."},{status:409}); return NextResponse.json({ok:true,variante:data});
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!await autorizado(request))return NextResponse.json({error:"Sesión o solicitud no válida."},{status:401}); const {id}=await params;
  const {error}=await supabaseAdmin.from("variantes_producto").delete().eq("id",id); if(error)return NextResponse.json({error:error.code==="23503"?"Esta variante ya pertenece a un pedido; ocúltala en lugar de eliminarla.":"No fue posible eliminar."},{status:409}); return NextResponse.json({ok:true});
}
