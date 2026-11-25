import assert from "node:assert/strict";
import test from "node:test";

import { nombreColorProducto } from "../app/lib/coloresProducto.ts";

test("convierte los tonos estándar en nombres legibles", () => {
  assert.equal(nombreColorProducto("#111111", "CORSET NEGRO"), "Negro");
  assert.equal(nombreColorProducto("#ef4444", "CORSET ROJO"), "Rojo");
  assert.equal(nombreColorProducto("#d6c7a1", "CORSET PIEL"), "Beige");
});

test("conserva el nombre configurado para tonos personalizados", () => {
  assert.equal(nombreColorProducto("#d8b4a0", "Piel"), "Piel");
});

test("conserva colores guardados como texto", () => {
  assert.equal(nombreColorProducto("Azul oscuro", "Azul"), "Azul oscuro");
});
