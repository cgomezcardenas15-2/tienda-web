const MAX_META_BROWSER_ID_LENGTH = 255;

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  if (!value) return null;

  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    // Una cookie malformada nunca debe impedir que el cliente continúe al pago.
    return null;
  }
}

export function sanitizeMetaBrowserIdentifier(value: unknown) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_META_BROWSER_ID_LENGTH ||
    !/^fb\.1\.\d{10,16}\.[A-Za-z0-9._-]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

export function getMetaBrowserIdentifiers() {
  return {
    fbp: sanitizeMetaBrowserIdentifier(readCookie("_fbp")),
    fbc: sanitizeMetaBrowserIdentifier(readCookie("_fbc")),
  };
}
