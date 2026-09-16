import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request:NextRequest){
  if(request.headers.get("origin")!==request.nextUrl.origin) return NextResponse.json({error:"Solicitud no permitida."},{status:403});
  if(!await getAdminSession()) return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const pedidoId=typeof body?.pedido_id==="string"?body.pedido_id:"";
  const tipo=typeof body?.tipo==="string"?body.tipo:"";
  const motivo=typeof body?.motivo==="string"?body.motivo.trim():"";
  const detalle=typeof body?.detalle==="string"?body.detalle.trim():"";
  const valor=Number(body?.valor_reembolso||0);
  const lineas=Array.isArray(body?.lineas)?body.lineas:[];
  if(!pedidoId||!["devolucion","garantia","reembolso"].includes(tipo)||motivo.length<5||motivo.length>500||!Number.isFinite(valor)||valor<0||lineas.length===0) return NextResponse.json({error:"Revisa el tipo, el motivo, el valor y los productos."},{status:400});
  const {data,error}=await supabaseAdmin.rpc("registrar_devolucion_admin",{p_pedido_id:pedidoId,p_tipo:tipo,p_motivo:motivo,p_detalle:detalle,p_valor_reembolso:valor,p_lineas:lineas});
  if(error){
    console.error("Error creando devolución:",{code:error.code,message:error.message});
    const falta=error.code==="PGRST202"||error.code==="42P01"||error.message.includes("schema cache");
    return NextResponse.json({error:falta?"Falta activar el módulo de devoluciones en Supabase.":error.message.includes("cantidad")?"Una cantidad supera lo comprado o ya fue gestionada.":"No fue posible crear el caso."},{status:falta?503:409});
  }
  return NextResponse.json({ok:true,id:data});
}
