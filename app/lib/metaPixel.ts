import { getCookieConsent } from "./cookieConsent";

export { getMetaContentId } from "./metaContentId";
export { META_PIXEL_ID } from "./metaConfig";

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
  onSent?: () => void;
  onDropped?: () => void;
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

    if (isMetaPixelReady()) {
      flushPendingMetaEvents();
      return;
    }

    if (attempts >= 150) clearPendingMetaEvents();
  }, 100);
}

function isMetaPixelReady() {
  if (typeof window === "undefined") return false;

  const fbq = window.fbq as
    | (((...args: unknown[]) => void) & {
        callMethod?: (...args: unknown[]) => void;
      })
    | undefined;

  return typeof fbq?.callMethod === "function";
}

function notify(callback?: () => void) {
  try {
    callback?.();
  } catch (error) {
    console.error("No fue posible actualizar el estado local del evento Meta.", error);
  }
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
  if (!window.fbq || !isMetaPixelReady()) return false;

  if (event.eventId) {
    window.fbq("track", event.name, event.parameters, { eventID: event.eventId });
  } else {
    window.fbq("track", event.name, event.parameters);
  }

  notify(event.onSent);
  return true;
}

export function trackMetaEvent(
  name: MetaCommerceEvent,
  parameters: MetaEventParameters,
  eventId?: string,
  callbacks?: Pick<PendingMetaEvent, "onSent" | "onDropped">
) {
  if (typeof window === "undefined" || !canUseMetaPixel()) return false;

  const event: PendingMetaEvent = { name, parameters, eventId, ...callbacks };

  if (sendMetaEvent(event)) return true;

  window.__novaPendingMetaEvents ??= [];
  window.__novaPendingMetaEvents.push(event);
  schedulePendingMetaEventsFlush();
  return true;
}

export function flushPendingMetaEvents() {
  if (typeof window === "undefined" || !canUseMetaPixel() || !isMetaPixelReady()) return;

  stopPendingFlushTimer();
  const pending = window.__novaPendingMetaEvents ?? [];
  window.__novaPendingMetaEvents = [];
  pending.forEach(sendMetaEvent);
}

export function clearPendingMetaEvents() {
  stopPendingFlushTimer();
  if (typeof window === "undefined") return;

  const pending = window.__novaPendingMetaEvents ?? [];
  window.__novaPendingMetaEvents = [];
  pending.forEach((event) => notify(event.onDropped));
}
