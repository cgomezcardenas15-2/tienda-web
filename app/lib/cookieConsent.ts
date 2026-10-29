export const COOKIE_CONSENT_STORAGE_KEY = "nova_cookie_preferences_v2";
export const COOKIE_CONSENT_EVENT = "nova:cookie-consent";
export const COOKIE_PREFERENCES_OPEN_EVENT = "nova:cookie-preferences-open";

export type CookieConsent = "essential" | "marketing";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  return saved === "essential" || saved === "marketing" ? saved : null;
}

export function saveCookieConsent(consent: CookieConsent) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: consent }));
}
