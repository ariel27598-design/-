// Cross-device sync for named libraries, backed by kvdb.io - a free, keyless
// public key-value store. Anyone who types the same library name, on any
// device, reads the same games. No login is required to read or write; only
// the bucket owner had to verify an email once, purely to activate write
// access on kvdb.io's side. Callers should treat failures as normal (the
// library still works from local storage) rather than as errors to surface
// loudly.

const KVDB_BUCKET = 'HSsCa1s8VPbLFWcDf9eNzx';
const BASE = `https://kvdb.io/${KVDB_BUCKET}`;

export interface CloudLibraryPayload {
  name: string;
  gameIds: string[];
  updatedAt: number;
}

function keyForName(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

export type SaveLibraryResult = { ok: true } | { ok: false; reason: 'not-verified' | 'network' };

export async function saveLibraryToCloud(name: string, gameIds: string[]): Promise<SaveLibraryResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const payload: CloudLibraryPayload = { name: name.trim(), gameIds, updatedAt: Date.now() };
    const res = await fetch(`${BASE}/${keyForName(name)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.status === 403) return { ok: false, reason: 'not-verified' };
    if (!res.ok) return { ok: false, reason: 'network' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadLibraryFromCloud(name: string): Promise<CloudLibraryPayload | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${BASE}/${keyForName(name)}`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.name !== 'string' || !Array.isArray(data.gameIds)) return null;
    return data as CloudLibraryPayload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
