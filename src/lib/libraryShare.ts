// Encodes a named library (name + game ids) into a URL query param so it can
// be shared as a plain link/QR code with no backend involved. With
// HashRouter, "/find?lib=..." lives entirely after the "#", so it's always
// served by the same static index.html regardless of host.

interface SharedLibraryPayload {
  n: string;
  g: string[];
}

function toBase64Url(json: string): string {
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

export function encodeLibraryPayload(name: string, gameIds: string[]): string {
  const payload: SharedLibraryPayload = { n: name, g: gameIds };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeLibraryPayload(encoded: string): { name: string; gameIds: string[] } | null {
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SharedLibraryPayload;
    if (!payload.n || !Array.isArray(payload.g)) return null;
    return { name: payload.n, gameIds: payload.g };
  } catch {
    return null;
  }
}

export function buildLibraryShareUrl(name: string, gameIds: string[], lang?: 'he' | 'en'): string {
  const encoded = encodeLibraryPayload(name, gameIds);
  const base = window.location.href.split('#')[0];
  const langParam = lang ? `&lang=${lang}` : '';
  return `${base}#/find?lib=${encoded}${langParam}`;
}
