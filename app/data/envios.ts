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

const TARIFAS_ENVIO = {
  CALI: 8000,
  VALLE: 12000,
  NACIONAL: 16000,
} as const;

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
  ciudad: string
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
      valor: TARIFAS_ENVIO.CALI,
      zona: "CALI",
      nombreZona: "Cali",
      mensaje: "Envío local en Cali.",
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
      valor: TARIFAS_ENVIO.VALLE,
      zona: "VALLE",
      nombreZona: "Valle del Cauca",
      mensaje:
        "Envío departamental en Valle del Cauca.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESTO DE COLOMBIA
  |--------------------------------------------------------------------------
  */

  return {
    disponible: true,
    valor: TARIFAS_ENVIO.NACIONAL,
    zona: "NACIONAL",
    nombreZona: "Nacional",
    mensaje: "Envío nacional.",
  };
}