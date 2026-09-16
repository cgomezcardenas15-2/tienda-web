import { NextRequest,NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
export async function POST(request:NextRequest){
  if(request.headers.get("origin")!==request.nextUrl.origin)return NextResponse.json({error:"Solicitud no permitida."},{status:403});if(!await getAdminSession())return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const b=await request.json().catch(()=>null) as Record<string,unknown>|null;const proveedor=typeof b?.proveedor_id==="string"?b.proveedor_id:"";const inicio=typeof b?.fecha_inicio==="string"?b.fecha_inicio:"";const fin=typeof b?.fecha_fin==="string"?b.fecha_fin:"";const notas=typeof b?.notas==="string"?b.notas.slice(0,1000):"";
  if(!proveedor||!/^\d{4}-\d{2}-\d{2}$/.test(inicio)||!/^\d{4}-\d{2}-\d{2}$/.test(fin)||fin<inicio)return NextResponse.json({error:"Revisa el proveedor y el periodo."},{status:400});
  const {data,error}=await supabaseAdmin.rpc("generar_liquidacion_comision",{p_proveedor_id:proveedor,p_fecha_inicio:inicio,p_fecha_fin:fin,p_notas:notas});if(error){console.error("Error generando liquidación:",{code:error.code,message:error.message});const falta=error.code==="PGRST202"||error.message.includes("schema cache");return NextResponse.json({error:falta?"Falta activar el módulo de comisiones.":error.message.includes("cruza")?"Ese periodo se cruza con una liquidación existente.":error.message.includes("ventas nuevas")?"No hay ventas nuevas con reglas de comisión en ese periodo.":"No fue posible generar la liquidación."},{status:falta?503:409});}return NextResponse.json({ok:true,id:data});
}
