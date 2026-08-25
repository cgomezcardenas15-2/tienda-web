/*
|--------------------------------------------------------------------------
| TIPOS DEL PEDIDO - NOVA
|--------------------------------------------------------------------------
|
| Este archivo define la estructura que tendrá un pedido dentro de NOVA.
|
| Aquí NO guardamos pedidos todavía.
| Aquí NO procesamos pagos.
| Aquí NO conectamos facturación.
|
| Solamente definimos cómo debe estar organizado un pedido para que,
| posteriormente, podamos utilizar esta misma estructura con:
|
| - Checkout
| - Base de datos
| - Pasarela de pagos
| - Transportadoras
| - Facturación electrónica
| - Panel administrativo
| - Historial de pedidos del cliente
|
*/

/*
|--------------------------------------------------------------------------
| DOCUMENTOS
|--------------------------------------------------------------------------
*/

export type TipoDocumento =
  | "CC"
  | "CE"
  | "NIT"
  | "PAS";

/*
|--------------------------------------------------------------------------
| ESTADOS DEL PAGO
|--------------------------------------------------------------------------
*/

export type EstadoPago =
  | "pendiente"
  | "procesando"
  | "pagado"
  | "rechazado"
  | "cancelado"
  | "reembolsado"
  | "parcialmente_reembolsado";

/*
|--------------------------------------------------------------------------
| ESTADOS DEL PEDIDO
|--------------------------------------------------------------------------
*/

export type EstadoPedido =
  | "pendiente_pago"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

/*
|--------------------------------------------------------------------------
| PRODUCTO DENTRO DEL PEDIDO
|--------------------------------------------------------------------------
|
| IMPORTANTE:
|
| Guardaremos una copia del nombre y precio del producto al momento
| de realizar la compra.
|
| Así, si posteriormente cambia el precio del producto en la tienda,
| el pedido histórico conservará el precio que realmente pagó
| el cliente.
|
*/

export type ProductoPedido = {
  productoId: string;

  nombre: string;

  precioUnitario: number;

  cantidad: number;

  subtotal: number;

  imagen?: string;

  sku?: string;
};

/*
|--------------------------------------------------------------------------
| COMPRADOR
|--------------------------------------------------------------------------
*/

export type CompradorPedido = {
  nombre: string;

  tipoDocumento: TipoDocumento;

  numeroDocumento: string;

  telefono: string;

  correo: string;

  razonSocial?: string;

  digitoVerificacion?: string;
};

/*
|--------------------------------------------------------------------------
| DIRECCIÓN
|--------------------------------------------------------------------------
*/

export type DireccionPedido = {
  departamento: string;

  ciudad: string;

  direccion: string;

  complemento?: string;

  instrucciones?: string;
};

/*
|--------------------------------------------------------------------------
| DATOS DE FACTURACIÓN
|--------------------------------------------------------------------------
|
| Estos datos pueden ser iguales a los del comprador o diferentes.
|
*/

export type FacturacionPedido = {
  mismosDatosComprador: boolean;

  nombre: string;

  tipoDocumento: TipoDocumento;

  numeroDocumento: string;

  correo: string;

  razonSocial?: string;

  digitoVerificacion?: string;

  departamento: string;

  ciudad: string;

  direccion: string;
};

/*
|--------------------------------------------------------------------------
| INFORMACIÓN DEL ENVÍO
|--------------------------------------------------------------------------
|
| Por ahora NOVA utiliza tarifas provisionales.
|
| Posteriormente esta estructura podrá recibir información real
| proveniente de una transportadora.
|
*/

export type EnvioPedido = {
  costo: number;

  zona: string;

  nombreZona: string;

  mensaje?: string;

  transportadora?: string;

  servicio?: string;

  numeroGuia?: string;

  urlSeguimiento?: string;
};

/*
|--------------------------------------------------------------------------
| INFORMACIÓN DEL PAGO
|--------------------------------------------------------------------------
|
| Estos campos quedarán preparados para la futura pasarela de pagos.
|
| Nunca utilizaremos información sensible de tarjetas dentro
| del pedido.
|
*/

export type PagoPedido = {
  estado: EstadoPago;

  proveedor?: string;

  referenciaTransaccion?: string;

  metodoPago?: string;

  fechaPago?: string;
};

/*
|--------------------------------------------------------------------------
| FACTURA ELECTRÓNICA
|--------------------------------------------------------------------------
|
| Esta información se completará cuando conectemos el proveedor
| definitivo de facturación electrónica.
|
*/

export type FacturaElectronicaPedido = {
  estado:
    | "pendiente"
    | "emitida"
    | "rechazada"
    | "anulada";

  proveedor?: string;

  numeroFactura?: string;

  cufe?: string;

  fechaEmision?: string;
};

/*
|--------------------------------------------------------------------------
| PEDIDO COMPLETO
|--------------------------------------------------------------------------
*/

export type Pedido = {
  /*
  |----------------------------------------------------------------------
  | IDENTIFICACIÓN
  |----------------------------------------------------------------------
  */

  id: string;

  numeroPedido: string;

  fechaCreacion: string;

  /*
  |----------------------------------------------------------------------
  | ESTADO
  |----------------------------------------------------------------------
  */

  estado: EstadoPedido;

  /*
  |----------------------------------------------------------------------
  | PRODUCTOS
  |----------------------------------------------------------------------
  */

  productos: ProductoPedido[];

  /*
  |----------------------------------------------------------------------
  | CLIENTE
  |----------------------------------------------------------------------
  */

  comprador: CompradorPedido;

  /*
  |----------------------------------------------------------------------
  | ENTREGA
  |----------------------------------------------------------------------
  */

  entrega: DireccionPedido;

  /*
  |----------------------------------------------------------------------
  | FACTURACIÓN
  |----------------------------------------------------------------------
  */

  facturacion: FacturacionPedido;

  /*
  |----------------------------------------------------------------------
  | VALORES
  |----------------------------------------------------------------------
  */

  subtotal: number;

  costoEnvio: number;

  descuento: number;

  total: number;

  moneda: "COP";

  /*
  |----------------------------------------------------------------------
  | ENVÍO
  |----------------------------------------------------------------------
  */

  envio: EnvioPedido;

  /*
  |----------------------------------------------------------------------
  | PAGO
  |----------------------------------------------------------------------
  */

  pago: PagoPedido;

  /*
  |----------------------------------------------------------------------
  | FACTURACIÓN ELECTRÓNICA
  |----------------------------------------------------------------------
  */

  facturaElectronica: FacturaElectronicaPedido;
};