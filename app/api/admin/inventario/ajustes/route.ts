import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/lib/adminAuth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const tipos=new Set(["correccion_entrada","correccion_salida","danio","perdida","devolucion_proveedor"]);

export async function POST(request:NextRequest){
  if(request.headers.get("origin")!==request.nextUrl.origin) return NextResponse.json({error:"Solicitud no permitida."},{status:403});
  if(!await getAdminSession()) return NextResponse.json({error:"La sesión administrativa expiró."},{status:401});
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  const productoId=typeof body?.producto_id==="string"?body.producto_id:"";
  const varianteId=typeof body?.variante_id==="string"&&body.variante_id?body.variante_id:null;
  const tipo=typeof body?.tipo==="string"?body.tipo:"";
  const cantidad=Number(body?.cantidad);
  const motivo=typeof body?.motivo==="string"?body.motivo.trim():"";
  if(!productoId||!tipos.has(tipo)||!Number.isInteger(cantidad)||cantidad<1||motivo.length<5||motivo.length>500) return NextResponse.json({error:"Revisa el producto, el tipo, la cantidad y explica el motivo."},{status:400});
  const {data,error}=await supabaseAdmin.rpc("registrar_ajuste_inventario",{p_producto_id:productoId,p_variante_id:varianteId,p_tipo:tipo,p_cantidad:cantidad,p_motivo:motivo});
  if(error){
    console.error("Error registrando ajuste de inventario:",{code:error.code,message:error.message});
    const faltaPreparar=error.code==="PGRST202"||error.code==="42883"||error.message.includes("schema cache");
    const mensaje=faltaPreparar?"Falta activar los ajustes de inventario en Supabase.":error.message.includes("negativas")?"No hay existencias suficientes para realizar esa salida.":error.message.includes("no controla")?"La opción seleccionada no controla existencias.":"No fue posible registrar el ajuste.";
    return NextResponse.json({error:mensaje},{status:faltaPreparar?503:409});
  }
  return NextResponse.json({ok:true,resultado:data});
}
