// Real store locations near ZIP 60487 (Tinley Park, IL), verified from
// retailer store locators / public listings, Nov 2026.
//   Best Buy — 7330 191st St, Tinley Park, IL 60487 — 41.548754, -87.795897 — (815) 469-1306
//   Target — 7300 191st St, Tinley Park, IL 60487 — 41.545249, -87.796067 — (815) 806-3210
//   Walmart Supercenter #1556 — 9265 159th St, Orland Hills, IL 60487
//   GameStop (Tinley Park Plaza) — 16205 Harlem Ave Ste D, Tinley Park, IL 60477 — (708) 342-0481
//     NOTE: several 2026 closure listings include this GameStop, and its
//     own locator page shows no hours. Its location is listed here, but
//     callers must verify it is still open before visiting; its stock is
//     Unknown either way.
// A store row is a location, NOT proof of stock. Stock lives only in
// inventory rows created by a verified retailer check (currently none).
import type { Store } from './types';

export const STORES: Store[] = [
  { id: 'best-buy-tinley-park', retailer_slug: 'best-buy', retailer_name: 'Best Buy', name: 'Best Buy — Tinley Park', address: '7330 191st St', city: 'Tinley Park', state: 'IL', zip: '60487', latitude: 41.548754, longitude: -87.795897, phone: '(815) 469-1306' },
  { id: 'target-tinley-park', retailer_slug: 'target', retailer_name: 'Target', name: 'Target — Tinley Park', address: '7300 191st St', city: 'Tinley Park', state: 'IL', zip: '60487', latitude: 41.545249, longitude: -87.796067, phone: '(815) 806-3210' },
  { id: 'walmart-orland-hills', retailer_slug: 'walmart', retailer_name: 'Walmart', name: 'Walmart Supercenter #1556 — Orland Hills', address: '9265 159th St', city: 'Orland Hills', state: 'IL', zip: '60487', latitude: 41.574, longitude: -87.842, phone: null },
  { id: 'gamestop-tinley-park', retailer_slug: 'gamestop', retailer_name: 'GameStop', name: 'GameStop — Tinley Park Plaza', address: '16205 Harlem Ave, Ste D', city: 'Tinley Park', state: 'IL', zip: '60477', latitude: 41.609, longitude: -87.803, phone: '(708) 342-0481', location_note: 'Several 2026 closure listings include this location and its locator page shows no hours. Verify it is still open before visiting.' },
];

export function findStore(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}

/** Haversine distance in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ZIP centroids for the areas we have verified store data for.
// Unknown ZIPs are geocoded live via OpenStreetMap Nominatim; if that
// fails, the API returns a clear error instead of fake stores.
export const ZIP_CENTERS: Record<string, { lat: number; lon: number; city: string; state: string }> = {
  '60487': { lat: 41.573, lon: -87.8, city: 'Tinley Park', state: 'IL' },
  '60477': { lat: 41.6, lon: -87.8, city: 'Tinley Park', state: 'IL' },
  '60462': { lat: 41.62, lon: -87.86, city: 'Orland Park', state: 'IL' },
  '60463': { lat: 41.6, lon: -87.9, city: 'Palos Heights', state: 'IL' },
};

export async function geocodeZip(zip: string): Promise<{ lat: number; lon: number; city: string; state: string } | null> {
  const known = ZIP_CENTERS[zip];
  if (known) return known;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`,
      { headers: { 'User-Agent': 'PokemonTCGTracker/1.0 (contact: tracker admin)' }, next: { revalidate: 86400 } } as RequestInit,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    if (!data.length) return null;
    const parts = (data[0].display_name ?? '').split(',').map((s) => s.trim());
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), city: parts[0] ?? '', state: parts[parts.length - 2] ?? '' };
  } catch {
    return null;
  }
}
