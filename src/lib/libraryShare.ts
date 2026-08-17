// Encodes a named library (name + game ids) into the URL hash so it can be
// shared as a plain link/QR code with no backend involved. The hash never
// reaches a server, so this works regardless of how the page is hosted.

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

export function buildLibraryShareUrl(name: string, gameIds: string[]): string {
  const payload: SharedLibraryPayload = { n: name, g: gameIds };
  const encoded = toBase64Url(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.hash = `lib=${encoded}`;
  return url.toString();
}

export function readSharedLibraryFromHash(): { name: string; gameIds: string[] } | null {
  const hash = window.location.hash.replace(/^#/, '');
  const match = hash.match(/(?:^|&)lib=([^&]+)/);
  if (!match) return null;
  try {
    const payload = JSON.parse(fromBase64Url(match[1])) as SharedLibraryPayload;
    if (!payload.n || !Array.isArray(payload.g)) return null;
    return { name: payload.n, gameIds: payload.g };
  } catch {
    return null;
  }
}

export function clearLibraryHash(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
