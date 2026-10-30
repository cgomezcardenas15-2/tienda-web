import { getCookieConsent } from "./cookieConsent";

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
  return true;
}

export function flushPendingMetaEvents() {
  if (typeof window === "undefined" || !canUseMetaPixel() || !window.fbq) return;

  const pending = window.__novaPendingMetaEvents ?? [];
  window.__novaPendingMetaEvents = [];
  pending.forEach(sendMetaEvent);
}

export function clearPendingMetaEvents() {
  if (typeof window !== "undefined") window.__novaPendingMetaEvents = [];
}

export function getMetaContentId(item: {
  id: string;
  varianteId?: string | null;
  sku?: string | null;
}) {
  const sku = item.sku?.trim();
  return sku || item.varianteId || item.id;
}
