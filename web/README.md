# Pokémon TCG Local Stock Tracker — Web app

Complete standalone Next.js 14 + TypeScript + Tailwind app. This is the
full public web app — not a starter manifest. The Muse artifact
`pokemon-tcg-local-stock-tracker` (v1) was the behavior reference; this
code is built from the project spec in `../README.md`.

## Vercel — Root Directory = `web/`

The repo root holds the deployment pack (README, schema, bot). The Next.js
app lives in `web/`, so in Vercel → Import → Project Settings set:

- **Framework Preset:** Next.js
- **Root Directory:** `web`
- **Build Command:** `npm run build` (default)
- **Install Command:** `npm install` (default)

Do not set the root directory to the repo root — there is no Next.js app
there, and the build will fail.

## Run locally

```bash
cd web
npm install
cp ../.env.example .env.local   # fill the Supabase + tracker values below
npm run dev                      # http://localhost:3000
npm run build && npm start       # production check
```

Public ZIP search works without any env vars (local catalog + real store
seed, all availability Unknown). Sign-in, watchlists, and verified
inventory need Supabase configured.

## Env vars (Vercel → Environment Variables; placeholders only in git)

| Variable | Required for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Auth + data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth + data (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side verified-inventory reads (API routes only, never in the browser) |
| `BEST_BUY_API_KEY` (or `BBY_API_KEY`) | Live Best Buy inventory. **Pending** — Chase's key request is pending as of 2026-11-24. Until set, Best Buy is Unknown. |
| `TRACKER_API_KEY` | Shared secret for the Discord bot → `POST /api/actions`. Generate with `openssl rand -hex 32`. |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord account linking (OAuth2). Redirect: `https://YOUR-DOMAIN/auth/discord/callback` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in (configured in Supabase → Authentication → Providers). Redirect: `https://YOUR-DOMAIN/auth/google/callback` |
| `DATABASE_URL` | Supabase Postgres connection string (only needed if you query Postgres directly; the app uses the Supabase client). |

Never commit a filled `.env` / `.env.local`. No real keys are in this repo.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — hero ("Find Pokémon cards near you."), ZIP search, popular tracked products, recently verified inventory (empty until a check writes a row), supported retailers, how it works, Discord promo. |
| `/search` | ZIP + radius 5/10/25/50/100, retailer / category / availability filters, sort by distance / recently verified / availability. Numbered store list with Directions links. |
| `/product/[id]` | Product detail — TCGdex image (catalog only, not stock), verified inventory for that product. |
| `/store/[id]` | Store detail — real address/coords, Directions link, verified inventory at that store. |
| `/dashboard` | Signed-in only — saved ZIPs, favorite stores, watched products, stock alerts, notification history, account settings, Discord linking. |
| `/admin` | Integration status for all 8 retailers, Best Buy key test (`GET /api/bestbuy`), inventory counts (inventory = 0 until a verified check). |
| `/docs` | Deployment guide, hard rules, API contract, retailer status, 60487 test. |
| `/login` | Supabase Auth — Google OAuth + email/password. |

## API routes (shared backend — the Discord bot calls these)

| Route | Purpose |
| --- | --- |
| `GET /api/search?zip=60487&radius=25` | ZIP search — real store locations, haversine distance, per-product inventory rows with honest availability states. |
| `GET /api/inventory?product_id=…&store_id=…` | Verified inventory rows only. Empty until a retailer check writes a row. |
| `GET/POST/DELETE /api/watchlist` | Signed-in user's watchlist. RLS: users only see their own rows. |
| `POST /api/actions` | Discord bot entry: `{"action":"runDiscordCommand","args":{"input":"search zip:60487 radius:25"}}`. Requires `Authorization: Bearer <TRACKER_API_KEY>`. |
| `GET /api/bestbuy` | Admin Best Buy key test (one lightweight Products call, never writes stock). |

## Files

```
web/
├── package.json, next.config.js, tsconfig.json, tailwind.config.js,
│   postcss.config.js, vercel.json, .gitignore
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── search/page.tsx, product/[id]/page.tsx, store/[id]/page.tsx
│   ├── dashboard/page.tsx, admin/page.tsx, docs/page.tsx, login/page.tsx
│   ├── auth/callback/route.ts
│   └── api/search/route.ts, api/inventory/route.ts,
│       api/watchlist/route.ts, api/actions/route.ts, api/bestbuy/route.ts
├── components/  SearchBar, AvailabilityBadge, ProductCard, StoreCard
└── lib/
    ├── types.ts, catalog.ts (20 products, 8 retailers), stores.ts (4 real
    │   Tinley Park-area stores, OSM/Nominatim geocoding, haversine),
    │   supabase.ts, tcgdex.ts, search.ts, discord.ts
    └── retailers/bestbuy.ts (official API v1 adapter)
```

## Hard rules (enforced server-side in `lib/search.ts`)

- Never invent inventory. No verified row → Unknown, source "not_checked".
- Checks older than 24h are demoted to Last known in stock.
- Quantity / price / SKU appear only when a verified source returns them.
- Best Buy: no key → "key not configured", Unknown, nothing written. A 403 writes nothing.
- Target/Walmart: Awaiting Credentials. GameStop / Pokémon Center / Costco / Sam's Club: Unsupported. Local stores: adapter slot only.
- TCGdex is catalog only (names/images), never stock.
