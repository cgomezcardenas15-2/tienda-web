import { getCookieConsent } from "./cookieConsent";

export { getMetaContentId } from "./metaContentId";

export const META_PIXEL_ID = "4729062324035766";

const PRODUCTION_HOSTS = new Set(["senornova.com.co", "www.senornova.com.co"]);

export type MetaCommerceEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type MetaContent = {
  id: string;
  quantity: number;
  item_price: number;
};

export type MetaEventParameters = {
  content_ids: string[];
  content_type: "product" | "product_group";
  contents: MetaContent[];
  currency: "COP";
  value: number;
  content_name?: string;
  num_items?: number;
};

type PendingMetaEvent = {
  name: MetaCommerceEvent;
  parameters: MetaEventParameters;
  eventId?: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __novaPendingMetaEvents?: PendingMetaEvent[];
  }
}

let pendingFlushTimer: number | undefined;

function stopPendingFlushTimer() {
  if (typeof window === "undefined" || pendingFlushTimer === undefined) return;
  window.clearInterval(pendingFlushTimer);
  pendingFlushTimer = undefined;
}

function schedulePendingMetaEventsFlush() {
  if (typeof window === "undefined" || pendingFlushTimer !== undefined) return;

  let attempts = 0;
  pendingFlushTimer = window.setInterval(() => {
    attempts += 1;

    if (!canUseMetaPixel()) {
      clearPendingMetaEvents();
      return;
    }

    if (typeof window.fbq === "function") {
      flushPendingMetaEvents();
      return;
    }

    if (attempts >= 150) stopPendingFlushTimer();
  }, 100);
}

export function canUseMetaPixel(pathname?: string) {
  if (typeof window === "undefined") return false;

  const currentPathname = pathname ?? window.location.pathname;
  return (
    !currentPathname.startsWith("/admin") &&
    PRODUCTION_HOSTS.has(window.location.hostname) &&
    getCookieConsent() === "marketing"
  );
}

function sendMetaEvent(event: PendingMetaEvent) {
  if (!window.fbq) return false;

  if (event.eventId) {
    window.fbq("track", event.name, event.parameters, { eventID: event.eventId });
  } else {
    window.fbq("track", event.name, event.parameters);
  }

  return true;
}

export function trackMetaEvent(
  name: MetaCommerceEvent,
  parameters: MetaEventParameters,
  eventId?: string
) {
  if (typeof window === "undefined" || !canUseMetaPixel()) return false;

  const event: PendingMetaEvent = { name, parameters, eventId };

  if (sendMetaEvent(event)) return true;

  window.__novaPendingMetaEvents ??= [];
  window.__novaPendingMetaEvents.push(event);
  schedulePendingMetaEventsFlush();
  return true;
}

export function flushPendingMetaEvents() {
  if (typeof window === "undefined" || !canUseMetaPixel() || !window.fbq) return;

  stopPendingFlushTimer();
  const pending = window.__novaPendingMetaEvents ?? [];
  window.__novaPendingMetaEvents = [];
  pending.forEach(sendMetaEvent);
}

export function clearPendingMetaEvents() {
  stopPendingFlushTimer();
  if (typeof window !== "undefined") window.__novaPendingMetaEvents = [];
}
