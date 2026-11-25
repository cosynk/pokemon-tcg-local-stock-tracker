export type Availability =
  | 'in_stock'
  | 'limited_stock'
  | 'out_of_stock'
  | 'unknown'
  | 'last_known_in_stock';

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'In stock',
  limited_stock: 'Limited stock',
  out_of_stock: 'Out of stock',
  unknown: 'Unknown',
  last_known_in_stock: 'Last known in stock',
};

export const VALID_RADII = [5, 10, 25, 50, 100] as const;
export type Radius = (typeof VALID_RADII)[number];

export interface Product {
  id: string;
  name: string;
  set_name: string;
  category: string;
  /** TCGdex set id used to look up a real card image at runtime; may be null. */
  tcgdex_set_id: string | null;
  image_url: string | null;
}

export interface Retailer {
  slug: string;
  name: string;
  website_url: string | null;
  integration_status: 'live' | 'awaiting_credentials' | 'unsupported';
  integration_notes: string;
}

export interface Store {
  id: string;
  retailer_slug: string;
  retailer_name: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  /** Honest caveat shown on the store page when listings disagree. */
  location_note?: string;
}

export interface InventoryResult {
  product_id: string;
  product_name: string;
  product_image: string | null;
  set_name: string;
  category: string;
  sku: string | null;
  store_id: string;
  store_name: string;
  store_address: string;
  retailer: string;
  retailer_slug: string;
  distance_miles: number | null;
  availability: Availability;
  quantity: number | null;
  price_cents: number | null;
  fulfillment_type: string | null;
  last_checked_at: string | null;
  source: string;
  source_type: string;
  confidence: 'verified' | 'unverified' | 'not_checked';
}
