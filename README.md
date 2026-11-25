# Pokémon TCG Local Stock Tracker — Public Deployment Guide

A public, production-shaped Pokémon TCG inventory tracker: ZIP-code search
for nearby retailers, verified store-level availability, watchlists, stock
alerts, and a Discord bot — website and bot sharing **one backend, one
database, one inventory source of truth**.

Reference implementation: the Muse artifact `pokemon-tcg-local-stock-tracker`
(v1) — homepage, ZIP search, dashboard, Discord console, Admin/Integrations,
Docs page. This folder is the standalone deployable version of that same
system. The artifact is the reference; this pack is what you deploy publicly.

> **Hard rule, carried over from the project spec:** never invent inventory
> quantities. Never treat a product listing as proof of physical store
> availability. Never display outdated inventory as confirmed current stock.
> Never show **Unknown** as **In stock**. Availability is only:
> `In stock` / `Limited stock` / `Out of stock` / `Unknown` /
> `Last known in stock`. Checks older than 24h are demoted to Last known.

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Website + API | **Vercel, Next.js 14 + TypeScript + Tailwind CSS** | Free Hobby tier to start; Next.js API routes are the shared backend the bot calls |
| Database + Auth | **Supabase — Postgres + Supabase Auth (Google OAuth)** | Free tier to start; Postgres with Row Level Security; Google sign-in, no passwords stored by the tracker |
| Discord bot | **Railway or Fly.io — Python 3.11+, discord.py** | Always-on host for the bot; token lives only in host env vars |
| Catalog data | **TCGdex (free, no key)** | Card/set names and images. Catalog only — **not** store stock. `pokemontcg.io` is deprecated and issues no new keys |
| Store locations | **Best Buy Stores API + OpenStreetMap geocoding** | Real addresses + haversine distance. Verified for ZIP 60487 / 25 mi in the reference build: 4 real stores |

Costs to start: $0 on free tiers (Vercel Hobby, Supabase Free, Railway trial / Fly.io free allowance). Best Buy API is free: 5,000 calls/day, 5 calls/sec. Costs can appear if traffic grows — set the Best Buy daily-call budget in Admin/Integrations and cache aggressively.

---

## 2. What is in this pack

```
pokemon-tcg-tracker-deploy/
├── README.md               # this guide
├── DEPLOY_CHECKLIST.md     # one-page tick-off list
├── .env.example            # every env var, placeholders only — never commit a filled .env
├── supabase/
│   └── schema.sql          # full Postgres DDL — 15 tables, indexes, FKs, RLS, seeds
├── bot/
│   ├── bot.py              # complete discord.py bot — 11 slash commands + /link
│   └── requirements.txt    # discord.py, httpx
└── web/
    ├── README.md           # web app notes + routes
    └── package.json        # Next.js + TypeScript + Tailwind starter manifest
```

The project pack retrieved from the tracker (`getprojectpack`) is the source
for the bot sketch, env vars, schema shape, retailer table, and OAuth notes
in this folder. Nothing here invents a retailer integration or a credential.

---

## 3. Accounts Chase must create himself

Only you can do these — I cannot create accounts, approve OAuth, or accept
terms on your behalf. Do them in this order:

1. **GitHub** (free) — github.com — create an account, create a private repo
   `pokemon-tcg-local-stock-tracker`, push this folder into it.
   Vercel and Railway both deploy from GitHub.
2. **Supabase** (free) — supabase.com — create a project (pick a region near
   you, e.g. US East). Save the project URL and the database password.
   In the Supabase dashboard: SQL Editor → paste `supabase/schema.sql` → Run.
   Verify: `products` = 20, `retailers` = 8, `inventory_sources` = 8,
   `inventory` = 0, `inventory_history` = 0.
3. **Vercel** (free Hobby) — vercel.com — sign in with GitHub, Import your
   repo, framework preset Next.js. Set the env vars from §5, deploy.
   Your site will be `https://<your-name>.vercel.app` until you add a domain.
4. **Discord Developer Portal** (free) — discord.com/developers — New
   Application → name it `Pokémon TCG Stock Tracker` → Bot → Reset Token
   (copy it once, store it in Railway only) → OAuth2 → add redirect URI
   `https://YOUR-DOMAIN/auth/discord/callback` → copy Client ID + Client Secret.
   Invite the bot: OAuth2 → URL Generator → scope `bot` + `applications.commands`
   → Bot Permissions: Send Messages, Embed Links → open the generated URL.
5. **Google Cloud Console** (free) — console.cloud.google.com — create a
   project → APIs & Services → Credentials → Create OAuth client (Web) →
   Authorized redirect URI `https://YOUR-DOMAIN/auth/google/callback` →
   copy Client ID + Client Secret. In Supabase: Authentication → Providers →
   enable Google, paste the same ID/secret. Google sign-in then works on the
   public site; the tracker never stores passwords.

---

## 4. Step-by-step setup, in order

### Step 1 — Database (Supabase, ~10 min)
1. Create the Supabase project.
2. SQL Editor → run `supabase/schema.sql`.
3. Check the counts in §3 step 2. If `inventory` is not 0, stop — something
   seeded fake stock; this schema deliberately seeds none.
4. Authentication → Providers → enable Google (after Step 4 below, or come
   back to it). Leave email sign-in enabled if you want email + password
   as well — Supabase hashes passwords; the tracker never sees plaintext.

### Step 2 — Website (Vercel, ~15 min)
1. Push this folder to GitHub.
2. Vercel → Add New → Project → Import the repo.
3. Build the web app per `web/README.md` (the Muse artifact is the reference
   implementation for pages, components, and the shared-backend actions).
4. Environment Variables in Vercel (see §5) → Deploy.
5. Open the site. Public ZIP search should work without signing in.
   Sign-in is your Supabase Auth (Google) — in the Muse artifact, sign-in
   was the Muse account instead; in the public deploy it is real Google /
   email auth via Supabase, as specced.

### Step 3 — Discord bot (Railway or Fly.io, ~15 min)
1. Railway: New Project → Deploy from GitHub repo → set Root Directory to
   `bot/` (or use a separate repo/service). Or Fly.io: `fly launch` in `bot/`.
2. Set env vars in Railway/Fly only (never in git):
   `DISCORD_BOT_TOKEN`, `TRACKER_API_BASE=https://YOUR-DOMAIN`,
   `TRACKER_API_KEY=<long random secret you generated>`.
   Generate the shared secret with `openssl rand -hex 32`.
3. Start command: `python bot.py` (Railway) — see `bot/README` notes in §5.
4. The website API must accept `Authorization: Bearer <TRACKER_API_KEY>`
   on `POST /api/actions` and reject anything else. The bot calls only
   `runDiscordCommand` — it never writes inventory directly.
5. In Discord, run `/help`. Then `/search zip:60487 radius:25` — it must
   return the same stores/distances as the website for the same ZIP.

### Step 4 — OAuth (Google + Discord linking, ~15 min)
- Google: as in §3 step 5. Test: sign out, Sign in with Google, confirm
  your dashboard loads and your watchlist is yours only.
- Discord linking: website Dashboard → Link Discord → the site shows a
  one-time code → in Discord run `/link code:<CODE>` (or use the website
  form). The bot binds `discord_user_id` to your account in
  `linked_discord_accounts`. Linking is **not** required for public
  `/search` / `/stock` / `/nearby` / `/stores` / `/help`.

### Step 5 — Retailer keys
- **Best Buy — see §6.** Nothing else is live on day one, by design.
- Target / Walmart: do not attempt unofficial endpoints. Leave them as
  Awaiting Credentials in Admin/Integrations until a partnership is signed.

### Step 6 — Test before announcing it
Run every check in §7. Do not share the public link until the 60487 test
passes on both website and Discord and the admin page shows no fake stock.

---

## 5. Environment variables

Copy `.env.example` to `.env` locally (never commit `.env`). Set the same
values in Vercel (website) and Railway/Fly (bot) — each host has its own
env-var screen; values do not travel through git.

| Variable | Where | Required for | Notes |
| --- | --- | --- | --- |
| `BEST_BUY_API_KEY` (or `BBY_API_KEY`) | Vercel (server) | Live Best Buy inventory | Free key from developer.bestbuy.com. See §6. Leave blank until it arrives. |
| `DISCORD_BOT_TOKEN` | Railway/Fly only | Discord bot | Discord Developer Portal → Bot → Reset Token. Never commit it. |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Vercel (server) | Discord account linking (OAuth2) | Developer Portal → OAuth2. Redirect: `https://YOUR-DOMAIN/auth/discord/callback` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Supabase + Vercel | Google sign-in | Google Cloud Console. Redirect: `https://YOUR-DOMAIN/auth/google/callback` |
| `DATABASE_URL` | Vercel (server) | Standalone Postgres | Supabase → Settings → Database → Connection string (URI). |
| `TRACKER_API_BASE` | Railway/Fly (bot) | Bot → backend | Your deployed site URL, e.g. `https://your-tracker.vercel.app` — no trailing slash. |
| `TRACKER_API_KEY` | Vercel + Railway/Fly | Bot → backend auth | Long random shared secret you generate. Not a Discord token, not a Best Buy key. |

---

## 6. Best Buy key — currently pending

**Status: Chase's key request is pending as of 2026-11-24. Not yet
received / activated. Best Buy stays as Awaiting Credentials until verified.**

How to get it (already requested — this is what to do when it arrives):
1. Go to developer.bestbuy.com → Get API Key. Sign up with a company
   email (free domains like Gmail may be rejected) — activation arrives by
   email, usually within minutes.
2. When the key arrives, **do not paste it in chat**. Save it via the
   secure link already sent for the `bestbuy` connector, or paste it only
   into Vercel → Environment Variables as `BEST_BUY_API_KEY`.
3. In the tracker, go to Admin/Integrations → Best Buy → Test key
   (`validateBestBuyKey` — one lightweight Products API call).
   It must return success before any stock is shown.
4. Then run a live check: `checkBestBuyAvailability` for one product near
   ZIP 60487. The adapter calls, in order:
   - `GET https://api.bestbuy.com/v1/products(search=...)` — `show=sku,name,salePrice,images,url`
   - `GET https://api.bestbuy.com/v1/stores(area(60487,25))`
   - `GET https://api.bestbuy.com/v1/products/{sku}/stores.json?postalCode=60487`
   Quantity is stored **only** when the API returns a number; a status-only
   response is stored as a status, never as a count. Free tier: 5,000
   calls/day, 5 calls/sec — the app caches results and preserves the
   original `last_checked_at`. The key travels as the `apiKey` query
   parameter because that is Best Buy's only documented auth mechanism;
   the key is read server-side only and never reaches the browser.

Until the key is set and validated, Best Buy shows **Missing / Unknown** in
Admin and **Unknown** on search results — never In stock.

---

## 7. How to test (ZIP 60487, radius 25)

This is the verified reference case from the Muse build.

1. Website: open the homepage → enter `60487` → radius `25` → Search stock.
   Expected (reference build): **4 stores near 60487 (Tinley Park, Illinois),
   0 verified in-stock results**. Every product status is `Unknown` with a
   source label, because no retailer has returned verified stock yet.
   Filters (retailer / category / availability) and sort (distance /
   recently verified) must work; a result click must open the product/store
   detail view.
2. Discord: in a server with the bot, run `/search zip:60487 radius:25`.
   Expected: the same 4 stores, same distances, same Unknown statuses —
   identical data from the same backend. Then `/stores` for the honest
   per-retailer status embed.
3. Dashboard: sign in → save ZIP 60487 → watch
   `Pokémon TCG: Mega Evolution Elite Trainer Box` → confirm it appears in
   your watchlist with your ZIP/radius and a cooldown. No alert should fire
   while availability is Unknown.
4. Admin: open Admin/Integrations → confirm Best Buy = Missing/Awaiting
   Credentials (until §6 is done), Target/Walmart = Awaiting Credentials,
   GameStop / Pokémon Center / Costco / Sam's Club = Unsupported, and
   `inventory` count = 0.
5. Negative test: search an invalid ZIP (e.g. `00000` or `abc`) — the app
   must show a validation error, not fake stores.

If website and Discord disagree on any store, distance, or status, that is
a bug — they share one backend and must never diverge.

---

## 8. Retailer status

| Retailer | Status | What is needed |
| --- | --- | --- |
| Best Buy | **Live adapter, awaiting key** | `BEST_BUY_API_KEY`. Official Developer API v1. See §6. |
| Target | Awaiting credentials | Redsky is internal / partnership-only. Needs a Target vendor/partnership agreement; no public key program. Do not use unofficial endpoints. |
| Walmart | Awaiting credentials | Walmart.io partner onboarding (business application + approval) for store-level stock. Marketplace API is seller-only. |
| GameStop | Unsupported | No public developer program exists. |
| Pokémon Center | Unsupported | Online-only storefront; no physical store inventory exists. |
| Costco | Unsupported | No public inventory API. |
| Sam's Club | Unsupported | No public inventory API. |
| Local game stores | Adapter slot ready | Store-reported feed; a shop must onboard and verify its own listings. |

The integration layer is modular: one adapter per retailer behind a common
interface (`search_products`, `nearby_stores`, `check_availability`). Adding
a retailer means adding one adapter + one `retailers` row + one
`inventory_sources` row — no rebuild of the app.

---

## 9. What is NOT done automatically

Be clear about this before you share the link:

- **Accounts:** Supabase, Vercel, GitHub, Discord Developer Portal, and
  Google Cloud Console accounts must be created by you, in your name.
  I cannot create them, approve OAuth consent screens, or accept terms.
- **Secrets:** Discord bot token, Google/Discord OAuth secrets, Supabase
  database password, and the Best Buy key must be pasted by you into the
  hosts' env-var screens (or the secure vault link for the Best Buy key).
  They are never in this repo.
- **Bot invite:** you must invite the bot to your Discord server with the
  OAuth2 URL generator (scopes `bot` + `applications.commands`).
- **Custom domain (optional):** buying / pointing a domain is yours.
  The free `vercel.app` URL works without one.
- **Best Buy key:** pending. No live Best Buy stock until §6 is done.
- **Target / Walmart:** no live stock until partnerships are signed.
  The site must keep showing them as Awaiting Credentials, not as stocked.
- **Moderation / abuse:** public sign-ups can be abused. Enable Supabase
  email confirmation, keep rate limiting on `/api/*` on, and watch the
  Admin sync log for failed jobs.
- **Costs:** free tiers cover a small public launch. If the Best Buy daily
  budget is hit, checks pause until the next day — that is intentional,
  not a bug.

---

## 10. Project structure (web app)

See `web/README.md` for the route map. In short: `/` (hero + ZIP search),
`/search` (results + filters), `/dashboard` (saved ZIPs, favorites,
watchlist, alerts, notification history), `/product/[id]`, `/store/[id]`,
`/admin` (users, retailers, sync log, freshness), `/docs` (this guide +
project pack), `/api/search`, `/api/inventory`, `/api/watchlist`.

Inventory engine rules (enforced server-side, not in the browser):
cached retailer calls, original `last_checked_at` preserved, dedupe +
cooldown on alerts, no duplicate `inventory` rows (`UNIQUE(product_id, store_id)`),
every check appended to `inventory_history`.

---

*Built 2026-11-24 for Chase. Reference: Muse artifact
`pokemon-tcg-local-stock-tracker` v1. No fake inventory. No real secrets in
this repo — placeholders only.*
