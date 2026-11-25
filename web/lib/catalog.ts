// The 20 real sealed products seeded by supabase/schema.sql.
// IDs are stable slugs (not database UUIDs — those are assigned by Supabase
// when schema.sql runs). No SKUs are invented: sku is always null here and
// is only filled from a verified retailer API or TCGdex response.
import type { Product, Retailer } from './types';

export const PRODUCTS: Product[] = [
  { id: 'mega-evolution-etb', name: 'Pokémon TCG: Mega Evolution Elite Trainer Box', set_name: 'Mega Evolution', category: 'Elite Trainer Box', tcgdex_set_id: 'ME01', image_url: null },
  { id: 'mega-evolution-booster-box', name: 'Pokémon TCG: Mega Evolution Booster Box', set_name: 'Mega Evolution', category: 'Booster Box', tcgdex_set_id: 'ME01', image_url: null },
  { id: 'mega-evolution-booster-bundle', name: 'Pokémon TCG: Mega Evolution Booster Bundle', set_name: 'Mega Evolution', category: 'Booster Bundle', tcgdex_set_id: 'ME01', image_url: null },
  { id: 'prismatic-evolutions-etb', name: 'Pokémon TCG: Scarlet & Violet — Prismatic Evolutions Elite Trainer Box', set_name: 'Scarlet & Violet — Prismatic Evolutions', category: 'Elite Trainer Box', tcgdex_set_id: 'SV8.5', image_url: null },
  { id: 'prismatic-evolutions-booster-bundle', name: 'Pokémon TCG: Scarlet & Violet — Prismatic Evolutions Booster Bundle', set_name: 'Scarlet & Violet — Prismatic Evolutions', category: 'Booster Bundle', tcgdex_set_id: 'SV8.5', image_url: null },
  { id: 'destined-rivals-etb', name: 'Pokémon TCG: Scarlet & Violet — Destined Rivals Elite Trainer Box', set_name: 'Scarlet & Violet — Destined Rivals', category: 'Elite Trainer Box', tcgdex_set_id: 'SV10', image_url: null },
  { id: 'destined-rivals-booster-box', name: 'Pokémon TCG: Scarlet & Violet — Destined Rivals Booster Box', set_name: 'Scarlet & Violet — Destined Rivals', category: 'Booster Box', tcgdex_set_id: 'SV10', image_url: null },
  { id: 'journey-together-etb', name: 'Pokémon TCG: Scarlet & Violet — Journey Together Elite Trainer Box', set_name: 'Scarlet & Violet — Journey Together', category: 'Elite Trainer Box', tcgdex_set_id: 'SV9', image_url: null },
  { id: 'journey-together-booster-box', name: 'Pokémon TCG: Scarlet & Violet — Journey Together Booster Box', set_name: 'Scarlet & Violet — Journey Together', category: 'Booster Box', tcgdex_set_id: 'SV9', image_url: null },
  { id: 'surging-sparks-etb', name: 'Pokémon TCG: Scarlet & Violet — Surging Sparks Elite Trainer Box', set_name: 'Scarlet & Violet — Surging Sparks', category: 'Elite Trainer Box', tcgdex_set_id: 'SV8', image_url: null },
  { id: 'surging-sparks-booster-box', name: 'Pokémon TCG: Scarlet & Violet — Surging Sparks Booster Box', set_name: 'Scarlet & Violet — Surging Sparks', category: 'Booster Box', tcgdex_set_id: 'SV8', image_url: null },
  { id: 'sv151-etb', name: 'Pokémon TCG: Scarlet & Violet — 151 Elite Trainer Box', set_name: 'Scarlet & Violet — 151', category: 'Elite Trainer Box', tcgdex_set_id: 'SV3.5', image_url: null },
  { id: 'sv151-booster-bundle', name: 'Pokémon TCG: Scarlet & Violet — 151 Booster Bundle', set_name: 'Scarlet & Violet — 151', category: 'Booster Bundle', tcgdex_set_id: 'SV3.5', image_url: null },
  { id: 'paldean-fates-etb', name: 'Pokémon TCG: Scarlet & Violet — Paldean Fates Elite Trainer Box', set_name: 'Scarlet & Violet — Paldean Fates', category: 'Elite Trainer Box', tcgdex_set_id: 'SV4.5', image_url: null },
  { id: 'obsidian-flames-etb', name: 'Pokémon TCG: Scarlet & Violet — Obsidian Flames Elite Trainer Box', set_name: 'Scarlet & Violet — Obsidian Flames', category: 'Elite Trainer Box', tcgdex_set_id: 'SV3', image_url: null },
  { id: 'crown-zenith-etb', name: 'Pokémon TCG: Crown Zenith Elite Trainer Box', set_name: 'Sword & Shield — Crown Zenith', category: 'Elite Trainer Box', tcgdex_set_id: 'SWSH12.5', image_url: null },
  { id: 'charizard-ex-super-premium', name: 'Pokémon TCG: Charizard ex Super-Premium Collection', set_name: 'Scarlet & Violet', category: 'Premium Collection', tcgdex_set_id: 'SV3', image_url: null },
  { id: 'blooming-waters-premium', name: 'Pokémon TCG: Blooming Waters Premium Collection', set_name: 'Scarlet & Violet — 151', category: 'Premium Collection', tcgdex_set_id: 'SV3.5', image_url: null },
  { id: 'poke-ball-tin', name: 'Pokémon TCG: Poké Ball Tin', set_name: 'Scarlet & Violet', category: 'Tin', tcgdex_set_id: 'SV1', image_url: null },
  { id: 'temporal-forces-booster-pack', name: 'Pokémon TCG: Scarlet & Violet — Temporal Forces Booster Pack', set_name: 'Scarlet & Violet — Temporal Forces', category: 'Booster Pack', tcgdex_set_id: 'SV5', image_url: null },
];

export const RETAILERS: Retailer[] = [
  { slug: 'best-buy', name: 'Best Buy', website_url: 'https://www.bestbuy.com', integration_status: 'awaiting_credentials', integration_notes: 'Live adapter built for official Developer API v1 (products / stores / availability). Awaiting BEST_BUY_API_KEY — key request pending as of 2026-11-24. Until a key is set, Best Buy stock is Unknown, never In stock.' },
  { slug: 'target', name: 'Target', website_url: 'https://www.target.com', integration_status: 'awaiting_credentials', integration_notes: 'Redsky is internal / partnership-only. Needs a Target vendor/partnership agreement; no public key program. Do not use unofficial endpoints.' },
  { slug: 'walmart', name: 'Walmart', website_url: 'https://www.walmart.com', integration_status: 'awaiting_credentials', integration_notes: 'Store-level stock is via Walmart.io partner onboarding (business application + approval). Marketplace API is seller-only and does not read store shelves.' },
  { slug: 'gamestop', name: 'GameStop', website_url: 'https://www.gamestop.com', integration_status: 'unsupported', integration_notes: 'No public developer program exists for store-level inventory.' },
  { slug: 'pokemon-center', name: 'Pokémon Center', website_url: 'https://www.pokemoncenter.com', integration_status: 'unsupported', integration_notes: 'Online-only storefront; no physical store inventory exists.' },
  { slug: 'costco', name: 'Costco', website_url: 'https://www.costco.com', integration_status: 'unsupported', integration_notes: 'No public inventory API.' },
  { slug: 'sams-club', name: "Sam's Club", website_url: 'https://www.samsclub.com', integration_status: 'unsupported', integration_notes: 'No public inventory API.' },
  { slug: 'local-game-store', name: 'Local game stores', website_url: null, integration_status: 'unsupported', integration_notes: 'Adapter slot ready. A shop must onboard and verify its own listings; no automatic feed exists yet.' },
];

export const CATEGORIES = [
  'Elite Trainer Box', 'Booster Box', 'Booster Bundle', 'Booster Pack',
  'Collection Box', 'Special Collection', 'Tin', 'Premium Collection', 'Accessory',
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
