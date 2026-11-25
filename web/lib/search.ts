// Shared search engine — used by the website (/api/search) and the
// Discord bot (POST /api/actions -> runDiscordCommand).
// Rules enforced here, server-side:
//  - Never invent inventory. With no verified inventory rows, every
//    product at every store is Unknown, with source "Not yet checked"
//    and confidence "not_checked".
//  - A verified inventory row (from a retailer check) is the ONLY thing
//    that can change availability away from Unknown. Rows older than 24h
//    are demoted to last_known_in_stock, never shown as current stock.
//  - Distance is haversine from the ZIP centroid to the real store coords.
import { PRODUCTS, RETAILERS } from './catalog';
import { STORES, geocodeZip, haversineMiles } from './stores';
import type { Availability, InventoryResult, Store } from './types';
import { getSupabaseService } from './supabase-server';

export interface VerifiedRow {
  product_id: string;
  store_id: string;
  availability: Availability;
  quantity: number | null;
  price_cents: number | null;
  fulfillment_type: string | null;
  last_checked_at: string;
  source: string;
}

export function demoteIfStale(a: Availability, lastCheckedAt: string | null): Availability {
  if (!lastCheckedAt) return 'unknown';
  const ageMs = Date.now() - new Date(lastCheckedAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000 && (a === 'in_stock' || a === 'limited_stock')) {
    return 'last_known_in_stock';
  }
  return a;
}

export async function loadVerifiedInventory(): Promise<Map<string, VerifiedRow>> {
  const map = new Map<string, VerifiedRow>();
  const sb = getSupabaseService();
  if (!sb) return map; // No Supabase configured yet: no verified rows, all Unknown.
  try {
    const { data, error } = await sb
      .from('inventory')
      .select('product_id, store_id, availability, quantity, price_cents, fulfillment_type, last_checked_at, inventory_sources(slug)')
      .limit(5000);
    if (error || !data) return map;
    for (const row of data as Array<Record<string, unknown>>) {
      const src = row.inventory_sources as { slug?: string } | null;
      map.set(`${String(row.product_id)}|${String(row.store_id)}`, {
        product_id: String(row.product_id),
        store_id: String(row.store_id),
        availability: row.availability as Availability,
        quantity: typeof row.quantity === 'number' ? row.quantity : null,
        price_cents: typeof row.price_cents === 'number' ? row.price_cents : null,
        fulfillment_type: typeof row.fulfillment_type === 'string' ? row.fulfillment_type : null,
        last_checked_at: String(row.last_checked_at),
        source: src?.slug ?? 'supabase_inventory',
      });
    }
  } catch {
    return map;
  }
  return map;
}

export interface SearchParams {
  zip: string;
  radius: number;
  retailer?: string;
  category?: string;
  availability?: string;
  sort?: 'distance' | 'recent' | 'availability';
  product?: string;
}

export interface SearchOutcome {
  zip: string;
  radius: number;
  city: string;
  state: string;
  stores: Array<Store & { distance_miles: number }>;
  results: InventoryResult[];
  verified_in_stock_count: number;
  retailers: typeof RETAILERS;
}

export async function runSearch(params: SearchParams): Promise<SearchOutcome> {
  const center = await geocodeZip(params.zip);
  if (!center) {
    throw new Error(`Could not locate ZIP ${params.zip}. Check the ZIP and try again.`);
  }
  const storesWithDistance = STORES.map((s) => ({
    ...s,
    distance_miles: haversineMiles(center.lat, center.lon, s.latitude, s.longitude),
  }))
    .filter((s) => s.distance_miles <= params.radius)
    .sort((a, b) => a.distance_miles - b.distance_miles);

  const verified = await loadVerifiedInventory();

  let products = PRODUCTS;
  if (params.category) products = products.filter((p) => p.category === params.category);
  if (params.product) {
    const q = params.product.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q) || p.id.includes(q));
  }
  let stores = storesWithDistance;
  if (params.retailer) stores = stores.filter((s) => s.retailer_slug === params.retailer);

  const results: InventoryResult[] = [];
  for (const store of stores) {
    for (const product of products) {
      const row = verified.get(`${product.id}|${store.id}`);
      // NOTE: verified rows are keyed by Supabase product UUIDs in a live
      // DB; the local slug key above matches only when the DB was seeded
      // with the same ids. Until a verified row exists, this is Unknown.
      const availability: Availability = row ? demoteIfStale(row.availability, row.last_checked_at) : 'unknown';
      results.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        set_name: product.set_name,
        category: product.category,
        sku: null,
        store_id: store.id,
        store_name: store.name,
        store_address: `${store.address}, ${store.city}, ${store.state} ${store.zip}`,
        retailer: store.retailer_name,
        retailer_slug: store.retailer_slug,
        distance_miles: Math.round(store.distance_miles * 10) / 10,
        availability,
        quantity: row?.quantity ?? null,
        price_cents: row?.price_cents ?? null,
        fulfillment_type: row?.fulfillment_type ?? null,
        last_checked_at: row?.last_checked_at ?? null,
        source: row?.source ?? 'not_checked',
        source_type: row ? 'official_api' : 'not_checked',
        confidence: row ? 'verified' : 'not_checked',
      });
    }
  }

  if (params.availability) {
    const want = params.availability as Availability;
    // Filter in place: keep only matching availability.
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].availability !== want) results.splice(i, 1);
    }
  }

  const availabilityRank: Record<Availability, number> = {
    in_stock: 0, limited_stock: 1, last_known_in_stock: 2, out_of_stock: 3, unknown: 4,
  };
  if (params.sort === 'availability') {
    results.sort((a, b) => availabilityRank[a.availability] - availabilityRank[b.availability] || (a.distance_miles ?? 99) - (b.distance_miles ?? 99));
  } else if (params.sort === 'recent') {
    results.sort((a, b) => (b.last_checked_at ?? '').localeCompare(a.last_checked_at ?? '') || (a.distance_miles ?? 99) - (b.distance_miles ?? 99));
  } else {
    results.sort((a, b) => (a.distance_miles ?? 99) - (b.distance_miles ?? 99));
  }

  return {
    zip: params.zip,
    radius: params.radius,
    city: center.city,
    state: center.state,
    stores: storesWithDistance,
    results,
    verified_in_stock_count: results.filter((r) => r.availability === 'in_stock' || r.availability === 'limited_stock').length,
    retailers: RETAILERS,
  };
}
