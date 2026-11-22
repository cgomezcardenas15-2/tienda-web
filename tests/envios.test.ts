import assert from "node:assert/strict";
import test from "node:test";

import { calcularEnvio } from "../app/data/envios.ts";
import { prepararPedido } from "../app/data/prepararPedido.ts";

const MENSAJE_DOMICILIO_CALI =
  "El domicilio se paga al momento de recibir el pedido. Su valor se confirmará antes del despacho y no está incluido en el total de esta compra.";

test("Cali deja el domicilio por pagar al recibir y fuera del total", () => {
  const envio = calcularEnvio(
    "Valle del Cauca",
    "Cali",
    {
      tarifaCali: 25_000,
      envioGratisActivo: false,
      envioGratisDesde: 0,
    },
    120_000,
  );

  assert.deepEqual(envio, {
    disponible: true,
    valor: 0,
    pagoContraentrega: true,
    zona: "CALI",
    nombreZona: "Cali",
    mensaje: MENSAJE_DOMICILIO_CALI,
  });
});

test("Cali ignora una antigua regla de envío gratis y conserva el mensaje correcto", () => {
  const envio = calcularEnvio(
    "  VALLE DEL CAUCA ",
    " CÁLI ",
    {
      tarifaCali: 8_000,
      envioGratisActivo: true,
      envioGratisDesde: 1,
    },
    999_999,
  );

  assert.equal(envio.valor, 0);
  assert.equal(envio.pagoContraentrega, true);
  assert.equal(envio.zona, "CALI");
  assert.equal(envio.mensaje, MENSAJE_DOMICILIO_CALI);
  assert.doesNotMatch(envio.mensaje.toLowerCase(), /gratis/);
});

test("fuera de Cali el transporte continúa pagándose al recibir", () => {
  const valle = calcularEnvio("Valle del Cauca", "Palmira");
  const nacional = calcularEnvio("Antioquia", "Medellín");

  for (const envio of [valle, nacional]) {
    assert.equal(envio.disponible, true);
    assert.equal(envio.valor, 0);
    assert.equal(envio.pagoContraentrega, true);
    assert.match(envio.mensaje.toLowerCase(), /no se cobra en esta compra/);
    assert.match(envio.mensaje.toLowerCase(), /cuando recibas/);
  }
});

test("sin departamento o ciudad no se habilita el envío", () => {
  assert.equal(calcularEnvio("", "Cali").disponible, false);
  assert.equal(calcularEnvio("Valle del Cauca", " ").disponible, false);
});

test("un pedido con domicilio por pagar solo suma los productos", () => {
  const pedido = prepararPedido({
    productos: [
      {
        productoId: "producto-1",
        nombre: "Producto de prueba técnica",
        precioUnitario: 50_000,
        cantidad: 2,
        subtotal: 100_000,
      },
    ],
    comprador: {
      nombre: "Cliente técnico",
      tipoDocumento: "CC",
      numeroDocumento: "1000000000",
      telefono: "3000000000",
      correo: "cliente@example.com",
    },
    entrega: {
      departamento: "Valle del Cauca",
      ciudad: "Cali",
      direccion: "Dirección de prueba",
    },
    facturacion: {
      mismosDatosComprador: true,
      nombre: "Cliente técnico",
      tipoDocumento: "CC",
      numeroDocumento: "1000000000",
      correo: "cliente@example.com",
      departamento: "Valle del Cauca",
      ciudad: "Cali",
      direccion: "Dirección de prueba",
    },
    envio: {
      costo: 0,
      pagoContraentrega: true,
      zona: "CALI",
      nombreZona: "Cali",
      mensaje: MENSAJE_DOMICILIO_CALI,
    },
    subtotal: 100_000,
    costoEnvio: 0,
    descuento: 10_000,
  });

  assert.equal(pedido.subtotal, 100_000);
  assert.equal(pedido.costoEnvio, 0);
  assert.equal(pedido.total, 90_000);
  assert.equal(pedido.envio.costo, 0);
  assert.equal(pedido.envio.pagoContraentrega, true);
});
