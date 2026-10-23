import "server-only";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export type ConfiguracionTienda = {
  compraMinimaActiva: boolean;
  montoMinimoCompra: number;
};

export class ConfiguracionTiendaNoDisponibleError extends Error {
  constructor() {
    super("No fue posible verificar la configuración de compra de la tienda.");
    this.name = "ConfiguracionTiendaNoDisponibleError";
  }
}

export async function obtenerConfiguracionTienda(): Promise<ConfiguracionTienda> {
  const { data, error } = await supabaseAdmin
    .from("configuracion_tienda")
    .select("compra_minima_activa,monto_minimo_compra")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("No fue posible leer la configuración de la tienda:", error.message);
    if (!data && !error) console.error("No existe la fila de configuración de la tienda.");
    throw new ConfiguracionTiendaNoDisponibleError();
  }

  const compraMinimaActiva = data.compra_minima_activa;
  const montoMinimoCompra = Number(data.monto_minimo_compra);

  if (
    typeof compraMinimaActiva !== "boolean" ||
    !Number.isInteger(montoMinimoCompra) ||
    montoMinimoCompra < 0 ||
    (compraMinimaActiva && montoMinimoCompra <= 0)
  ) {
    console.error("La configuración de compra de la tienda contiene datos inválidos.");
    throw new ConfiguracionTiendaNoDisponibleError();
  }

  return {
    compraMinimaActiva,
    montoMinimoCompra,
  };
}

export function validarCompraMinima(subtotal: number, configuracion: ConfiguracionTienda) {
  const faltante = Math.max(0, configuracion.montoMinimoCompra - subtotal);
  return {
    cumple: !configuracion.compraMinimaActiva || faltante === 0,
    faltante,
  };
}
