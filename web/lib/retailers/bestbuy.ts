// Best Buy live adapter — official Developer API v1 only.
//   GET https://api.bestbuy.com/v1/products(search=...)?apiKey=...
//   GET https://api.bestbuy.com/v1/stores(area(ZIP,RADIUS))?apiKey=...
//   GET https://api.bestbuy.com/v1/products/{sku}/stores.json?postalCode=ZIP&apiKey=...
// The key is server-side only, passed as the `apiKey` query param because
// that is Best Buy's only documented auth mechanism.
// Until a key is set and validated: status = 'key_not_configured', every
// availability is Unknown, and nothing is written. A 403 writes nothing.
export type BestBuyStatus = 'key_not_configured' | 'connected' | 'invalid_key' | 'error';

export function bestBuyKey(): string {
  return process.env.BEST_BUY_API_KEY || process.env.BBY_API_KEY || '';
}

export function bestBuyStatus(): BestBuyStatus {
  return bestBuyKey() ? 'connected' : 'key_not_configured';
}

const BASE = 'https://api.bestbuy.com/v1';

async function bbFetch(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const key = bestBuyKey();
  if (!key) return { ok: false, status: 0, data: null };
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}apiKey=${encodeURIComponent(key)}&format=json`, {
    headers: { Accept: 'application/json' },
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }
  return { ok: res.ok, status: res.status, data };
}

/** One lightweight Products call to validate the key. Never writes stock. */
export async function validateBestBuyKey(): Promise<{ status: BestBuyStatus; detail: string }> {
  if (!bestBuyKey()) {
    return { status: 'key_not_configured', detail: 'BEST_BUY_API_KEY is not set. Best Buy stock stays Unknown.' };
  }
  const { ok, status } = await bbFetch('/products(search=Pokemon)?show=sku&pageSize=1');
  if (ok) return { status: 'connected', detail: 'Best Buy API key validated (Products API returned 200).' };
  if (status === 403) return { status: 'invalid_key', detail: 'Best Buy returned 403 — key invalid or not activated. Nothing was written.' };
  return { status: 'error', detail: `Best Buy returned HTTP ${status}. Nothing was written.` };
}

export interface BestBuyStore { storeId: number; name: string; address: string; city: string; region: string; postalCode: string; lat: number; lng: number; phone: string }

export async function bestBuyStoresNear(zip: string, radius: number): Promise<BestBuyStore[]> {
  if (!bestBuyKey()) return [];
  const { ok, data } = await bbFetch(`/stores(area(${zip},${radius}))?show=storeId,name,address,city,region,postalCode,lat,lng,phone`);
  if (!ok || !data || typeof data !== 'object') return [];
  const stores = (data as { stores?: BestBuyStore[] }).stores;
  return Array.isArray(stores) ? stores : [];
}

export interface BestBuyAvailability { sku: string; storeId: number; available: boolean; quantity: number | null }

export async function bestBuyAvailability(sku: string, zip: string): Promise<BestBuyAvailability[]> {
  if (!bestBuyKey()) return [];
  const { ok, data } = await bbFetch(`/products/${encodeURIComponent(sku)}/stores.json?postalCode=${zip}`);
  if (!ok || !data || typeof data !== 'object') return [];
  const stores = (data as { stores?: Array<{ storeId: number; availability?: { available?: boolean; quantity?: number } }> }).stores;
  if (!Array.isArray(stores)) return [];
  return stores.map((s) => ({
    sku,
    storeId: s.storeId,
    available: Boolean(s.availability?.available),
    // Quantity only when the API returns a number — never invented.
    quantity: typeof s.availability?.quantity === 'number' ? s.availability.quantity : null,
  }));
}
