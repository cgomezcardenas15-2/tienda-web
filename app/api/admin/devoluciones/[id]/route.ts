import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(request.headers.get("origin")!==request.nextUrl.origin) return NextResponse.json({error:"Solicitud no permitida."},{status:403});
  if(!await getAdminSession()) return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const {id}=await params;
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const estado=typeof body?.estado==="string"?body.estado:"";
  if(!["aprobada","rechazada","recibida","reembolsada","cerrada"].includes(estado)) return NextResponse.json({error:"Estado no permitido."},{status:400});
  const {data,error}=await supabaseAdmin.rpc("actualizar_devolucion_admin",{p_devolucion_id:id,p_estado:estado,p_nota:typeof body?.nota==="string"?body.nota:"",p_metodo_reembolso:typeof body?.metodo_reembolso==="string"?body.metodo_reembolso:null,p_referencia_reembolso:typeof body?.referencia_reembolso==="string"?body.referencia_reembolso:null,p_reintegrar_inventario:body?.reintegrar_inventario===true});
  if(error){console.error("Error actualizando devolución:",{code:error.code,message:error.message});return NextResponse.json({error:error.message.includes("cambio de estado")?"Ese cambio de estado no está permitido.":error.message.includes("medio")?"Indica el medio utilizado para devolver el dinero.":"No fue posible actualizar el caso."},{status:409});}
  return NextResponse.json({ok:true,resultado:data});
}
