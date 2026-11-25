# Pokémon TCG Local Stock Tracker — Web app

Next.js 14 + TypeScript + Tailwind CSS. This is the **starter manifest** for
the public deploy — the full working reference implementation is the Muse
artifact `pokemon-tcg-local-stock-tracker` (v1). Build the standalone app
from that reference; do not re-invent the pages.

## Install

```bash
cd web
npm install
cp ../.env.example .env.local   # fill DATABASE_URL, BEST_BUY_API_KEY, etc.
npm run dev                      # http://localhost:3000
npm run build && npm start       # production
```

Deploy: push to GitHub → Vercel → Import → framework Next.js → set the
env vars from `../.env.example` in Vercel → Deploy.

## Routes / pages

| Route | Purpose |
| --- | --- |
| `/` | Homepage — hero ("Find Pokémon cards near you."), ZIP search field + radius, popular tracked products, recently verified inventory, supported retailers, how it works, alternating Pokémon character sections, Discord bot promo, footer. No fabricated inventory: empty states say "No verified stock yet." |
| `/search` | ZIP search + dashboard — ZIP input, radius 5/10/25/50/100, retailer / category / availability filters, sort by distance / recently verified / availability. Results show product image, name, set, retailer, price (only if from a verified source), availability, store name/address/distance, quantity (only if the source returned one), last checked, source. Numbered store list with Directions links (no embedded map control in v1). |
| `/dashboard` | Signed-in only — saved ZIPs, favorite stores, watched products (watchlist with per-watch ZIP/radius/retailer/cooldown), active stock alerts, recently viewed, notification history, account settings. |
| `/product/[id]` | Product detail — catalog data (TCGdex), identifiers, verified inventory across nearby stores, watch button. |
| `/store/[id]` | Store detail — address, distance, hours (when provided), verified inventory at that store. |
| `/admin` | Admin only — total/active users, retailers + integration status, API request status, sync history, failed jobs, product/store management, notification stats, data-freshness monitoring. |
| `/docs` | This deployment guide + the project pack (bot source, DB DDL, env vars, OAuth + retailer setup). |

## API routes (shared backend — the Discord bot calls these)

| Route | Purpose |
| --- | --- |
| `POST /api/actions` | Single entry the Discord bot uses: `{"action": "runDiscordCommand", "args": {"input": "search zip:60487 radius:25"}}`. Requires `Authorization: Bearer <TRACKER_API_KEY>`. |
| `GET /api/search?zip=60487&radius=25` | ZIP search — real store locations (Best Buy Stores API + OSM geocoding), per-product inventory rows with honest availability states. |
| `GET /api/inventory?product_id=…&store_id=…` | Verified inventory for a product/store. Empty until a retailer check writes a row. |
| `GET/POST /api/watchlist` | Signed-in user's watchlist (GET list, POST add, DELETE remove). RLS: users only see their own rows. |
| `POST /api/inventory/refresh` | Server-side sync job trigger (admin / cron only). Calls retailer adapters, writes `inventory` + `inventory_history`, triggers deduped alerts. Never triggered by a page view. |

## Shared-backend rules

- Website and Discord bot share one Postgres database (Supabase) and one
  inventory service. The bot never keeps its own inventory DB.
- Auth is Supabase Auth (Google OAuth + email). In the Muse artifact,
  sign-in was the Muse account; in the public deploy it is real Supabase
  Auth, as specced. Never store passwords in plaintext; Supabase hashes them.
- Inventory engine: cached retailer calls, original `last_checked_at`
  preserved, checks older than 24h demoted to `last_known_in_stock`,
  alerts deduped with per-watch cooldowns.
- TCGdex is the catalog source (free, no key). `pokemontcg.io` is
  deprecated — do not build on it for new keys.
- Best Buy adapter: official Developer API v1 only, `BEST_BUY_API_KEY`
  server-side only, never sent to the browser. Until the key is set and
  validated, Best Buy is Unknown — never In stock.

## Files to create in the standalone app

```
web/
├── package.json          # this folder's manifest (already here)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # /
│   ├── search/page.tsx     # /search
│   ├── dashboard/page.tsx  # /dashboard
│   ├── product/[id]/page.tsx
│   ├── store/[id]/page.tsx
│   ├── admin/page.tsx
│   ├── docs/page.tsx
│   └── api/
│       ├── actions/route.ts
│       ├── search/route.ts
│       ├── inventory/route.ts
│       └── watchlist/route.ts
├── components/             # SearchBar, StoreCard, ProductCard, WatchButton, …
└── lib/
    ├── supabase.ts
    ├── retailers/          # one adapter per retailer (best-buy.ts, …)
    ├── inventory.ts        # cache, freshness, dedupe
    └── tcgdex.ts           # catalog client
```

The Muse artifact is the design and behavior reference for all of these.
Do not copy fake inventory into any of them.
