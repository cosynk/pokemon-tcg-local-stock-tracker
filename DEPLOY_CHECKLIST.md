# Pokémon TCG Local Stock Tracker — Deploy Checklist

Tick each box as you go. **"I did for you"** is already built in this pack /
the tracker artifact. **"Only you can do"** needs your accounts, clicks,
and secrets — I cannot do those for you.

## I did for you ✅

- [x] Tracker website built (Muse artifact `pokemon-tcg-local-stock-tracker` v1)
- [x] ZIP search verified: 60487 / 25 mi → 4 real stores, 0 verified in-stock
- [x] Dashboard: saved ZIPs, favorites, watchlist, alerts, notifications
- [x] Discord console: all 11 slash commands + `/link`, same backend as website
- [x] Admin / Integrations page + Docs page with project pack
- [x] Best Buy live adapter (official Developer API v1) — code ready, key pending
- [x] Retailer research (Stage 1): Target/Walmart partnership-only, others unsupported
- [x] This deployment pack: `README.md`, `supabase/schema.sql` (15 tables),
      `bot/bot.py` (complete), `bot/requirements.txt`, `.env.example`,
      `web/README.md` + `web/package.json`
- [x] No fake inventory anywhere: `inventory` starts empty, Unknown ≠ In stock

## Only you can do 🔲

### Accounts (create these yourself)
- [ ] GitHub account + repo `pokemon-tcg-local-stock-tracker` (push this folder)
- [ ] Supabase account + project (save DB password + project URL)
- [ ] Vercel account (sign in with GitHub)
- [ ] Discord Developer Portal: application + bot created
- [ ] Google Cloud Console: OAuth client created

### Database
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Verify counts: products = 20, retailers = 8, inventory_sources = 8,
      inventory = 0, inventory_history = 0

### Website deploy
- [ ] Vercel → Import GitHub repo → framework Next.js → Deploy
- [ ] Set Vercel env vars: `DATABASE_URL`, `GOOGLE_CLIENT_ID`,
      `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
      `TRACKER_API_KEY` (generate with `openssl rand -hex 32`)
- [ ] Open the public site, search ZIP `60487` radius `25` — expect 4 stores,
      0 verified in-stock

### Discord bot deploy
- [ ] Copy `DISCORD_BOT_TOKEN` (Bot → Reset Token) into Railway / Fly.io only
- [ ] Set bot env vars: `DISCORD_BOT_TOKEN`, `TRACKER_API_BASE` (your Vercel URL),
      `TRACKER_API_KEY` (same secret as Vercel)
- [ ] Start the bot (`python bot.py`), confirm `Logged in as …` in logs
- [ ] Invite the bot: OAuth2 URL Generator → scopes `bot` + `applications.commands`
- [ ] In Discord: `/help` works, then `/search zip:60487 radius:25` matches the website

### OAuth
- [ ] Google: redirect `https://YOUR-DOMAIN/auth/google/callback` in Google Cloud
      + Supabase Auth → Providers → Google enabled with same ID/secret
- [ ] Discord linking: redirect `https://YOUR-DOMAIN/auth/discord/callback`
      in Discord Developer Portal → OAuth2
- [ ] Test sign-in with Google; test `/link` with a code from the dashboard

### Best Buy key — PENDING
- [ ] Key request already submitted — wait for the activation email
- [ ] When it arrives: save it via the secure link (do NOT paste it in chat)
      or paste it only into Vercel env vars as `BEST_BUY_API_KEY`
- [ ] Admin → Best Buy → Test key (must succeed before any stock shows)
- [ ] Live check for one product near 60487 — confirm a real API result is stored

### Before you share the link
- [ ] Website + Discord 60487 tests both pass and agree
- [ ] Admin shows Best Buy = Missing (until key), Target/Walmart = Awaiting
      Credentials, GameStop / Pokémon Center / Costco / Sam's = Unsupported
- [ ] No fake stock anywhere; empty states read "No verified stock yet"
- [ ] Share the Vercel URL — the Muse artifact link is private to you

---
*If a box is blocked, note what is blocking it (e.g. "waiting on Best Buy
email") and move on to the next unblocked box. Do not skip the 60487 test.*
