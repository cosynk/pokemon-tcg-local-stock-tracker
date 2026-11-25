import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Docs</h1>
      <p className="mt-2 text-slate-600">Deployment guide, API contract, and the rules this tracker will not break.</p>

      <h2 className="mt-8 text-xl font-bold">Hard rules</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        <li>Never invent inventory quantities.</li>
        <li>Never treat a product listing as proof of physical store availability.</li>
        <li>Never display outdated inventory as confirmed current stock — checks older than 24h are demoted to Last known in stock.</li>
        <li>Never claim an API integration works if it is only a placeholder.</li>
        <li>Never bypass authentication, CAPTCHAs, access controls, or retailer restrictions. No unauthorized endpoints.</li>
        <li>Availability is only: In stock, Limited stock, Out of stock, Unknown, Last known in stock.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Deploy</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
        <li>Supabase: create a project, run <code className="rounded bg-slate-100 px-1">supabase/schema.sql</code> in the SQL Editor. Verify products=20, retailers=8, inventory_sources=8, inventory=0.</li>
        <li>GitHub: push this repo. Vercel: Import, framework Next.js, <strong>Root Directory = web/</strong>.</li>
        <li>Vercel env vars: <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="rounded bg-slate-100 px-1">BEST_BUY_API_KEY</code> (when it arrives), <code className="rounded bg-slate-100 px-1">TRACKER_API_KEY</code> (generate with <code className="rounded bg-slate-100 px-1">openssl rand -hex 32</code>), <code className="rounded bg-slate-100 px-1">DISCORD_CLIENT_ID</code> / <code className="rounded bg-slate-100 px-1">DISCORD_CLIENT_SECRET</code>.</li>
        <li>Discord bot (Railway/Fly.io, root <code className="rounded bg-slate-100 px-1">bot/</code>): <code className="rounded bg-slate-100 px-1">DISCORD_BOT_TOKEN</code>, <code className="rounded bg-slate-100 px-1">TRACKER_API_BASE</code> (your Vercel URL), <code className="rounded bg-slate-100 px-1">TRACKER_API_KEY</code> (same secret as Vercel). Start: <code className="rounded bg-slate-100 px-1">python bot.py</code>.</li>
        <li>Google sign-in: Google Cloud OAuth client, redirect <code className="rounded bg-slate-100 px-1">https://YOUR-DOMAIN/auth/google/callback</code>, enable Google in Supabase → Authentication → Providers.</li>
      </ol>

      <h2 className="mt-8 text-xl font-bold">API (shared backend)</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        <li><code className="rounded bg-slate-100 px-1">GET /api/search?zip=60487&amp;radius=25</code> — ZIP search, real stores, honest availability.</li>
        <li><code className="rounded bg-slate-100 px-1">GET /api/inventory?product_id=…&amp;store_id=…</code> — verified rows only, empty until a check writes one.</li>
        <li><code className="rounded bg-slate-100 px-1">GET/POST/DELETE /api/watchlist</code> — signed-in user&apos;s watchlist.</li>
        <li><code className="rounded bg-slate-100 px-1">POST /api/actions</code> — Discord bot entry. Bearer <code className="rounded bg-slate-100 px-1">TRACKER_API_KEY</code>. Body: <code className="rounded bg-slate-100 px-1">{`{"action":"runDiscordCommand","args":{"input":"search zip:60487 radius:25"}}`}</code></li>
        <li><code className="rounded bg-slate-100 px-1">GET /api/bestbuy</code> — Admin Best Buy key test.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Retailer status</h2>
      <p className="mt-2 text-slate-700">Best Buy: live adapter, awaiting key. Target / Walmart: awaiting credentials (partnership only). GameStop, Pokémon Center, Costco, Sam&apos;s Club: unsupported. Local game stores: adapter slot only. Catalog: TCGdex (free, no key) — names/images only, not stock.</p>

      <h2 className="mt-8 text-xl font-bold">Test</h2>
      <p className="mt-2 text-slate-700">Website: search ZIP 60487, radius 25 — expect 4 stores near Tinley Park, Illinois, 0 verified in-stock results. Discord: <code className="rounded bg-slate-100 px-1">/search zip:60487 radius:25</code> must return the same 4 stores and the same Unknown statuses. Full guide: <Link href="https://github.com/cosynk/pokemon-tcg-local-stock-tracker" className="text-brand-blue underline">the repo README</Link>.</p>
    </div>
  );
}
