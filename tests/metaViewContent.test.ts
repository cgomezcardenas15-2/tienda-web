import assert from "node:assert/strict";
import test from "node:test";

import { buildMetaViewContent } from "../app/lib/metaViewContent.ts";

const productoSimple = {
  id: "producto-simple-id",
  sku: " GPS-01 ",
  nombre: "GPS sin SIM",
  precio: 85000,
};

const productoConVariantes = {
  id: "200e6dea-9a0e-486d-b2fc-a0c8a7561c40",
  sku: "AC-LYA48",
  nombre: "PATA LATERAL ALUMINIO GRADUABLE HASTA 10CM",
  precio: 47000,
};

const varianteAzul = {
  id: "variante-azul-id",
  sku: "AC-LYA48-AZU",
  precio: 48000,
};

test("producto sin variantes envía su SKU exacto como product", () => {
  const evento = buildMetaViewContent({
    producto: productoSimple,
    tieneVariantes: false,
  });

  assert.ok(evento);
  assert.equal(evento.eventKey, "producto-simple-id:GPS-01");
  assert.deepEqual(evento.parameters, {
    content_ids: ["GPS-01"],
    content_type: "product",
    contents: [{ id: "GPS-01", quantity: 1, item_price: 85000 }],
    currency: "COP",
    value: 85000,
    content_name: "GPS sin SIM",
    num_items: 1,
  });
});

test("producto con variantes no envía el SKU padre sin una variante elegida", () => {
  const evento = buildMetaViewContent({
    producto: productoConVariantes,
    tieneVariantes: true,
  });

  assert.equal(evento, null);
});

test("producto con variantes envía el SKU exacto y el precio de la variante", () => {
  const evento = buildMetaViewContent({
    producto: productoConVariantes,
    variante: varianteAzul,
    tieneVariantes: true,
  });

  assert.ok(evento);
  assert.equal(evento.eventKey, `${productoConVariantes.id}:AC-LYA48-AZU`);
  assert.equal(evento.parameters.content_type, "product");
  assert.deepEqual(evento.parameters.content_ids, ["AC-LYA48-AZU"]);
  assert.deepEqual(evento.parameters.contents, [
    { id: "AC-LYA48-AZU", quantity: 1, item_price: 48000 },
  ]);
  assert.equal(evento.parameters.value, 48000);
});

test("variante sin precio propio usa el precio del producto", () => {
  const evento = buildMetaViewContent({
    producto: productoConVariantes,
    variante: { ...varianteAzul, precio: null },
    tieneVariantes: true,
  });

  assert.ok(evento);
  assert.equal(evento.parameters.value, 47000);
  assert.equal(evento.parameters.contents[0].item_price, 47000);
});

test("la clave evita repetir la misma variante y distingue variantes diferentes", () => {
  const azulPrimero = buildMetaViewContent({
    producto: productoConVariantes,
    variante: varianteAzul,
    tieneVariantes: true,
  });
  const azulSegundo = buildMetaViewContent({
    producto: productoConVariantes,
    variante: { ...varianteAzul },
    tieneVariantes: true,
  });
  const negro = buildMetaViewContent({
    producto: productoConVariantes,
    variante: { ...varianteAzul, id: "variante-negra-id", sku: "AC-LYA48-NEG" },
    tieneVariantes: true,
  });

  assert.ok(azulPrimero && azulSegundo && negro);
  assert.equal(azulPrimero.eventKey, azulSegundo.eventKey);
  assert.notEqual(azulPrimero.eventKey, negro.eventKey);
});

test("los ViewContent de variantes coinciden con id del feed, no con item_group_id", () => {
  const idsDelFeed = new Set([
    "AC-LYA48-AZU",
    "AC-LYA48-BEI",
    "AC-LYA48-GRI",
    "AC-LYA48-MOR",
    "AC-LYA48-NEG",
    "AC-LYA48-ROJ",
  ]);
  const itemGroupIdDelFeed = "AC-LYA48";
  const evento = buildMetaViewContent({
    producto: productoConVariantes,
    variante: varianteAzul,
    tieneVariantes: true,
  });

  assert.ok(evento);
  assert.equal(idsDelFeed.has(evento.parameters.content_ids[0]), true);
  assert.notEqual(evento.parameters.content_ids[0], itemGroupIdDelFeed);
});
