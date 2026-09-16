import { NextRequest,NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
export async function POST(request:NextRequest){
  if(request.headers.get("origin")!==request.nextUrl.origin)return NextResponse.json({error:"Solicitud no permitida."},{status:403});
  if(!await getAdminSession())return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const b=await request.json().catch(()=>null) as Record<string,unknown>|null;const proveedor=typeof b?.proveedor_id==="string"?b.proveedor_id:"";const producto=typeof b?.producto_id==="string"?b.producto_id:"";const variante=typeof b?.variante_id==="string"&&b.variante_id?b.variante_id:null;const tipo=typeof b?.tipo==="string"?b.tipo:"";const valor=Number(b?.valor);
  if(!proveedor||!producto||!["porcentaje","valor_fijo"].includes(tipo)||!Number.isFinite(valor)||valor<0||(tipo==="porcentaje"&&valor>100))return NextResponse.json({error:"Revisa el proveedor, producto y valor de la comisión."},{status:400});
  const consulta=supabaseAdmin.from("reglas_comision_proveedor").select("id").eq("proveedor_id",proveedor).eq("producto_id",producto);const {data:existente,error:consultaError}=variante?await consulta.eq("variante_id",variante).maybeSingle():await consulta.is("variante_id",null).maybeSingle();
  if(consultaError)return NextResponse.json({error:consultaError.code==="42P01"?"Falta activar el módulo de comisiones.":"No fue posible revisar la regla."},{status:503});
  const operacion=existente?supabaseAdmin.from("reglas_comision_proveedor").update({tipo,valor,activo:true,actualizado_en:new Date().toISOString()}).eq("id",existente.id):supabaseAdmin.from("reglas_comision_proveedor").insert({proveedor_id:proveedor,producto_id:producto,variante_id:variante,tipo,valor});const {error}=await operacion;
  if(error)return NextResponse.json({error:"No fue posible guardar la regla."},{status:400});return NextResponse.json({ok:true});
}
