import { createHash } from "node:crypto";

const META_EVENT_SOURCE_URL = "https://www.senornova.com.co/pago/resultado";

export type MetaPurchaseContent = {
  id: string;
  quantity: number;
  item_price: number;
};

export type MetaPurchaseInput = {
  pedidoId: string;
  numeroPedido: string;
  value: number;
  currency: "COP";
  contents: MetaPurchaseContent[];
  numItems: number;
  email: string;
  phone: string;
  fbp?: string | null;
  fbc?: string | null;
  eventTime?: number;
};

export type MetaPurchaseEvent = {
  event_name: "Purchase";
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: "website";
  user_data: {
    em: string[];
    ph: string[];
    fbp?: string;
    fbc?: string;
  };
  custom_data: {
    currency: "COP";
    value: number;
    content_ids: string[];
    content_type: "product";
    contents: MetaPurchaseContent[];
    num_items: number;
    order_id: string;
  };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits;
}

function assertValidPurchase(input: MetaPurchaseInput) {
  if (!input.pedidoId || !input.numeroPedido) {
    throw new Error("La compra no tiene un identificador válido para Meta.");
  }
  if (!Number.isFinite(input.value) || input.value <= 0 || input.currency !== "COP") {
    throw new Error("El valor o la moneda de la compra no son válidos para Meta.");
  }
  if (!input.contents.length) {
    throw new Error("La compra no contiene productos para Meta.");
  }
  if (
    input.contents.some(
      (item) =>
        !item.id ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.item_price) ||
        item.item_price < 0
    )
  ) {
    throw new Error("La compra contiene una línea inválida para Meta.");
  }

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  if (!email || !phone) {
    throw new Error("La compra no contiene datos de coincidencia válidos para Meta.");
  }
}

export function buildMetaPurchaseEvent(input: MetaPurchaseInput): MetaPurchaseEvent {
  assertValidPurchase(input);

  const event: MetaPurchaseEvent = {
    event_name: "Purchase",
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: `purchase:${input.pedidoId}`,
    event_source_url: META_EVENT_SOURCE_URL,
    action_source: "website",
    user_data: {
      em: [sha256(normalizeEmail(input.email))],
      ph: [sha256(normalizePhone(input.phone))],
    },
    custom_data: {
      currency: "COP",
      value: input.value,
      content_ids: input.contents.map((item) => item.id),
      content_type: "product",
      contents: input.contents,
      num_items: input.numItems,
      order_id: input.numeroPedido,
    },
  };

  if (input.fbp) event.user_data.fbp = input.fbp;
  if (input.fbc) event.user_data.fbc = input.fbc;

  return event;
}

type FetchLike = typeof fetch;

export type MetaApiDeliveryResult =
  | { ok: true; eventsReceived: number; traceId?: string }
  | { ok: false; status: number | null; retryable: boolean; reason: string };

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function deliverMetaEvent(options: {
  pixelId: string;
  accessToken: string;
  apiVersion: string;
  event: MetaPurchaseEvent;
  fetchImpl?: FetchLike;
  maxAttempts?: number;
  retryDelayMs?: number;
}): Promise<MetaApiDeliveryResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  const url = `https://graph.facebook.com/${options.apiVersion}/${options.pixelId}/events`;
  let lastResult: MetaApiDeliveryResult = {
    ok: false,
    status: null,
    retryable: true,
    reason: "Meta no respondió.",
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [options.event] }),
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      });

      const body = (await response.json().catch(() => null)) as
        | { events_received?: number; fbtrace_id?: string }
        | null;

      if (response.ok && Number(body?.events_received) >= 1) {
        return {
          ok: true,
          eventsReceived: Number(body?.events_received),
          traceId: body?.fbtrace_id,
        };
      }

      const retryable = isRetryableStatus(response.status);
      lastResult = {
        ok: false,
        status: response.status,
        retryable,
        reason: response.ok
          ? "Meta aceptó la solicitud, pero no confirmó eventos recibidos."
          : "Meta rechazó la solicitud de conversión.",
      };

      if (!retryable) return lastResult;
    } catch {
      lastResult = {
        ok: false,
        status: null,
        retryable: true,
        reason: "No fue posible conectar con Meta.",
      };
    }

    if (attempt < maxAttempts && retryDelayMs > 0) {
      await wait(retryDelayMs * attempt);
    }
  }

  return lastResult;
}
