import "server-only";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export type ConfiguracionTienda = {
  compraMinimaActiva: boolean;
  montoMinimoCompra: number;
};

export const CONFIGURACION_TIENDA_PREDETERMINADA: ConfiguracionTienda = {
  compraMinimaActiva: false,
  montoMinimoCompra: 0,
};

export async function obtenerConfiguracionTienda(): Promise<ConfiguracionTienda> {
  const { data, error } = await supabaseAdmin
    .from("configuracion_tienda")
    .select("compra_minima_activa,monto_minimo_compra")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No fue posible leer la configuración de la tienda:", error.message);
    return CONFIGURACION_TIENDA_PREDETERMINADA;
  }

  return {
    compraMinimaActiva: data.compra_minima_activa === true,
    montoMinimoCompra: Math.max(0, Number(data.monto_minimo_compra) || 0),
  };
}

export function validarCompraMinima(subtotal: number, configuracion: ConfiguracionTienda) {
  const faltante = Math.max(0, configuracion.montoMinimoCompra - subtotal);
  return {
    cumple: !configuracion.compraMinimaActiva || configuracion.montoMinimoCompra <= 0 || faltante === 0,
    faltante,
  };
}
