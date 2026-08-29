export type ZonaEnvio =
  | "CALI"
  | "VALLE"
  | "NACIONAL";

export type ResultadoEnvio = {
  disponible: boolean;
  valor: number;
  zona: ZonaEnvio | null;
  nombreZona: string;
  mensaje: string;
};

/*
|--------------------------------------------------------------------------
| TARIFAS TEMPORALES DE ENVÍO
|--------------------------------------------------------------------------
|
| Estas tarifas son internas y provisionales.
|
| Más adelante podremos reemplazar este cálculo por la API de una
| transportadora sin tener que reconstruir el checkout.
|
| IMPORTANTE:
| Los valores actuales son únicamente valores de desarrollo.
| Antes de publicar NOVA deberán reemplazarse por tarifas comerciales
| reales.
|
*/

export type ConfiguracionEnvios = {
  tarifaCali: number;
  tarifaValle: number;
  tarifaNacional: number;
  envioGratisActivo: boolean;
  envioGratisDesde: number;
};

export const CONFIGURACION_ENVIOS_PREDETERMINADA: ConfiguracionEnvios = {
  tarifaCali: 8000,
  tarifaValle: 12000,
  tarifaNacional: 16000,
  envioGratisActivo: false,
  envioGratisDesde: 0,
};

/*
|--------------------------------------------------------------------------
| NORMALIZAR TEXTO
|--------------------------------------------------------------------------
|
| Nos permite comparar nombres sin preocuparnos por:
|
| - mayúsculas
| - minúsculas
| - tildes
| - espacios adicionales
|
*/

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| CALCULAR ENVÍO
|--------------------------------------------------------------------------
|
| Recibe:
|
| departamento
| ciudad
|
| y devuelve toda la información necesaria para mostrar el envío
| en el checkout.
|
*/

export function calcularEnvio(
  departamento: string,
  ciudad: string,
  configuracion = CONFIGURACION_ENVIOS_PREDETERMINADA,
  subtotal = 0,
): ResultadoEnvio {
  if (
    departamento.trim() === "" ||
    ciudad.trim() === ""
  ) {
    return {
      disponible: false,
      valor: 0,
      zona: null,
      nombreZona: "",
      mensaje:
        "Selecciona departamento y ciudad para calcular el envío.",
    };
  }

  const departamentoNormalizado =
    normalizarTexto(departamento);

  const ciudadNormalizada =
    normalizarTexto(ciudad);

  const esEnvioGratis =
    configuracion.envioGratisActivo &&
    configuracion.envioGratisDesde > 0 &&
    subtotal >= configuracion.envioGratisDesde;

  /*
  |--------------------------------------------------------------------------
  | CALI
  |--------------------------------------------------------------------------
  */

  if (
    departamentoNormalizado ===
      "valle del cauca" &&
    ciudadNormalizada === "cali"
  ) {
    return {
      disponible: true,
      valor: esEnvioGratis ? 0 : configuracion.tarifaCali,
      zona: "CALI",
      nombreZona: "Cali",
      mensaje: esEnvioGratis ? "Envío gratis por el valor de tu compra." : "Envío local en Cali.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESTO DEL VALLE DEL CAUCA
  |--------------------------------------------------------------------------
  */

  if (
    departamentoNormalizado ===
    "valle del cauca"
  ) {
    return {
      disponible: true,
      valor: esEnvioGratis ? 0 : configuracion.tarifaValle,
      zona: "VALLE",
      nombreZona: "Valle del Cauca",
      mensaje: esEnvioGratis ? "Envío gratis por el valor de tu compra." : "Envío departamental en Valle del Cauca.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESTO DE COLOMBIA
  |--------------------------------------------------------------------------
  */

  return {
    disponible: true,
    valor: esEnvioGratis ? 0 : configuracion.tarifaNacional,
    zona: "NACIONAL",
    nombreZona: "Nacional",
    mensaje: esEnvioGratis ? "Envío gratis por el valor de tu compra." : "Envío nacional.",
  };
}
