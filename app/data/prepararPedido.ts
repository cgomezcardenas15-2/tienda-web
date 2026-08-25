import type {
  CompradorPedido,
  DireccionPedido,
  EnvioPedido,
  FacturacionPedido,
  ProductoPedido,
  TipoDocumento,
} from "../../types/pedido";

/*
|--------------------------------------------------------------------------
| DATOS QUE RECIBE EL PREPARADOR
|--------------------------------------------------------------------------
|
| Este archivo NO crea el pedido definitivo.
|
| Solamente organiza la información proveniente del checkout para que,
| posteriormente, podamos enviarla de forma segura al servidor.
|
*/

export type DatosPreparacionPedido = {
  productos: ProductoPedido[];

  comprador: CompradorPedido;

  entrega: DireccionPedido;

  facturacion: FacturacionPedido;

  envio: EnvioPedido;

  subtotal: number;

  costoEnvio: number;

  descuento?: number;
};

/*
|--------------------------------------------------------------------------
| PEDIDO PREPARADO
|--------------------------------------------------------------------------
|
| Todavía NO contiene:
|
| - ID definitivo
| - número de pedido
| - fecha oficial
| - pago aprobado
| - factura electrónica
|
| Esos datos deberán generarse posteriormente del lado del servidor.
|
*/

export type PedidoPreparado = {
  productos: ProductoPedido[];

  comprador: CompradorPedido;

  entrega: DireccionPedido;

  facturacion: FacturacionPedido;

  subtotal: number;

  costoEnvio: number;

  descuento: number;

  total: number;

  moneda: "COP";

  envio: EnvioPedido;
};

/*
|--------------------------------------------------------------------------
| PREPARAR PEDIDO
|--------------------------------------------------------------------------
*/

export function prepararPedido(
  datos: DatosPreparacionPedido
): PedidoPreparado {
  const descuentoSeguro = Math.max(
    0,
    datos.descuento ?? 0
  );

  const subtotalSeguro = Math.max(
    0,
    datos.subtotal
  );

  const envioSeguro = Math.max(
    0,
    datos.costoEnvio
  );

  const total = Math.max(
    0,
    subtotalSeguro +
      envioSeguro -
      descuentoSeguro
  );

  return {
    productos: datos.productos,

    comprador: datos.comprador,

    entrega: datos.entrega,

    facturacion: datos.facturacion,

    subtotal: subtotalSeguro,

    costoEnvio: envioSeguro,

    descuento: descuentoSeguro,

    total,

    moneda: "COP",

    envio: {
      ...datos.envio,
      costo: envioSeguro,
    },
  };
}

/*
|--------------------------------------------------------------------------
| AUXILIAR DOCUMENTO
|--------------------------------------------------------------------------
|
| Convierte el valor del formulario a un TipoDocumento reconocido
| por NOVA.
|
*/

export function convertirTipoDocumento(
  tipo: string
): TipoDocumento {
  if (
    tipo === "CC" ||
    tipo === "CE" ||
    tipo === "NIT" ||
    tipo === "PAS"
  ) {
    return tipo;
  }

  throw new Error(
    "Tipo de documento no válido."
  );
}