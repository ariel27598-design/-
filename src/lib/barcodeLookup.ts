// Best-effort lookup of a product's name/image from its barcode using a free,
// keyless, CORS-enabled public UPC database. This is inherently unreliable:
// the free tier is rate-limited, and it mostly indexes US/global retail
// barcodes, so Israeli or small-run local editions will often not be found.
// Callers should treat a null result as normal, not an error.

export interface BarcodeLookupResult {
  name?: string;
  imageUrl?: string;
}

export async function lookupProductByBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) return null;

    const name = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : undefined;
    const imageUrl = Array.isArray(item.images) && typeof item.images[0] === 'string' ? item.images[0] : undefined;
    if (!name && !imageUrl) return null;

    return { name, imageUrl };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
