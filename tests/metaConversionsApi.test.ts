import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMetaPurchaseEvent,
  deliverMetaEvent,
  type MetaPurchaseInput,
} from "../app/lib/metaConversionsApiCore.ts";

const purchase: MetaPurchaseInput = {
  pedidoId: "772b8db4-141b-4ec6-8788-85bdde823237",
  numeroPedido: "NOVA-000014",
  value: 10000,
  currency: "COP",
  contents: [
    { id: "GR-01", quantity: 2, item_price: 5000 },
  ],
  numItems: 2,
  email: " Cliente@Ejemplo.com ",
  phone: "310 555 0101",
  fbp: "fb.1.1700000000000.123456789",
  eventTime: 1_800_000_000,
};

test("Purchase usa IDs de catálogo, COP y el mismo event_id del navegador", () => {
  const event = buildMetaPurchaseEvent(purchase);

  assert.equal(event.event_name, "Purchase");
  assert.equal(event.event_id, `purchase:${purchase.pedidoId}`);
  assert.equal(event.action_source, "website");
  assert.deepEqual(event.custom_data.content_ids, ["GR-01"]);
  assert.deepEqual(event.custom_data.contents, purchase.contents);
  assert.equal(event.custom_data.value, 10000);
  assert.equal(event.custom_data.currency, "COP");
  assert.equal(event.custom_data.order_id, "NOVA-000014");
});

test("Purchase transforma correo y teléfono sin incluir datos personales en claro", () => {
  const event = buildMetaPurchaseEvent(purchase);
  const serialized = JSON.stringify(event);

  assert.match(event.user_data.em[0], /^[a-f0-9]{64}$/);
  assert.match(event.user_data.ph[0], /^[a-f0-9]{64}$/);
  assert.equal(event.user_data.fbp, purchase.fbp);
  assert.equal(serialized.includes("cliente@ejemplo.com"), false);
  assert.equal(serialized.includes("3105550101"), false);
});

test("el event_id permanece estable en reintentos del mismo pedido", () => {
  const first = buildMetaPurchaseEvent(purchase);
  const second = buildMetaPurchaseEvent({ ...purchase, eventTime: purchase.eventTime! + 60 });

  assert.equal(first.event_id, second.event_id);
});

test("la entrega usa el píxel existente, token en cabecera y confirma events_received", async () => {
  let requestedUrl = "";
  let authorization = "";
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(url);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(JSON.stringify({ events_received: 1, fbtrace_id: "trace-test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const result = await deliverMetaEvent({
    pixelId: "4729062324035766",
    accessToken: "test-token-not-a-secret",
    apiVersion: "v24.0",
    event: buildMetaPurchaseEvent(purchase),
    fetchImpl,
    maxAttempts: 1,
  });

  assert.deepEqual(result, {
    ok: true,
    eventsReceived: 1,
    traceId: "trace-test",
  });
  assert.equal(
    requestedUrl,
    "https://graph.facebook.com/v24.0/4729062324035766/events"
  );
  assert.equal(authorization, "Bearer test-token-not-a-secret");
});

test("reintenta un error transitorio sin cambiar el evento", async () => {
  let attempts = 0;
  const bodies: string[] = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    attempts += 1;
    bodies.push(String(init?.body));
    if (attempts === 1) {
      return new Response(JSON.stringify({ error: { message: "temporal" } }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const result = await deliverMetaEvent({
    pixelId: "4729062324035766",
    accessToken: "test-token-not-a-secret",
    apiVersion: "v24.0",
    event: buildMetaPurchaseEvent(purchase),
    fetchImpl,
    maxAttempts: 2,
    retryDelayMs: 0,
  });

  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
  assert.equal(bodies[0], bodies[1]);
});

test("no reintenta rechazos permanentes de Meta", async () => {
  let attempts = 0;
  const fetchImpl = (async () => {
    attempts += 1;
    return new Response(JSON.stringify({ error: { message: "token inválido" } }), {
      status: 400,
    });
  }) as typeof fetch;

  const result = await deliverMetaEvent({
    pixelId: "4729062324035766",
    accessToken: "invalid-test-token",
    apiVersion: "v24.0",
    event: buildMetaPurchaseEvent(purchase),
    fetchImpl,
    maxAttempts: 3,
    retryDelayMs: 0,
  });

  assert.equal(result.ok, false);
  assert.equal(attempts, 1);
});
