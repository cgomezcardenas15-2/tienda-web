import "server-only";

import {
  CONFIGURACION_ENVIOS_PREDETERMINADA,
  type ConfiguracionEnvios,
} from "@/app/data/envios";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function obtenerConfiguracionEnvios(): Promise<ConfiguracionEnvios> {
  const { data, error } = await supabaseAdmin
    .from("configuracion_envios")
    .select("tarifa_cali,tarifa_valle,tarifa_nacional,envio_gratis_activo,envio_gratis_desde")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No fue posible leer la configuración de envíos:", error.message);
    return CONFIGURACION_ENVIOS_PREDETERMINADA;
  }

  return {
    tarifaCali: Number(data.tarifa_cali),
    tarifaValle: Number(data.tarifa_valle),
    tarifaNacional: Number(data.tarifa_nacional),
    envioGratisActivo: data.envio_gratis_activo === true,
    envioGratisDesde: Number(data.envio_gratis_desde),
  };
}
