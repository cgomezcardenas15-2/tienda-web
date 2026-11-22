export type ZonaEnvio =
  | "CALI"
  | "VALLE"
  | "NACIONAL";

export type ResultadoEnvio = {
  disponible: boolean;
  valor: number;
  pagoContraentrega: boolean;
  zona: ZonaEnvio | null;
  nombreZona: string;
  mensaje: string;
};

export type ConfiguracionEnvios = {
  tarifaCali: number;
  envioGratisActivo: boolean;
  envioGratisDesde: number;
};

export const CONFIGURACION_ENVIOS_PREDETERMINADA: ConfiguracionEnvios = {
  tarifaCali: 8000,
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
  _configuracion = CONFIGURACION_ENVIOS_PREDETERMINADA,
  _subtotal = 0,
): ResultadoEnvio {
  // Conservamos estos argumentos para no romper a los consumidores actuales;
  // las antiguas tarifas ya no intervienen porque el transporte se paga al recibir.
  void _configuracion;
  void _subtotal;

  if (
    departamento.trim() === "" ||
    ciudad.trim() === ""
  ) {
    return {
      disponible: false,
      valor: 0,
      pagoContraentrega: false,
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
      valor: 0,
      pagoContraentrega: true,
      zona: "CALI",
      nombreZona: "Cali",
      mensaje: "El domicilio se paga al momento de recibir el pedido. Su valor se confirmará antes del despacho y no está incluido en el total de esta compra.",
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
      valor: 0,
      pagoContraentrega: true,
      zona: "VALLE",
      nombreZona: "Valle del Cauca",
      mensaje: "El costo del transporte no se cobra en esta compra. Lo pagas directamente a la transportadora cuando recibas el pedido.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESTO DE COLOMBIA
  |--------------------------------------------------------------------------
  */

  return {
    disponible: true,
    valor: 0,
    pagoContraentrega: true,
    zona: "NACIONAL",
    nombreZona: "Nacional",
    mensaje: "El costo del transporte no se cobra en esta compra. Lo pagas directamente a la transportadora cuando recibas el pedido.",
  };
}
