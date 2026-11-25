import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, RETAILERS } from '@/lib/catalog';

export default function Home() {
  const popular = PRODUCTS.slice(0, 6);
  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Find Pokémon cards near you.</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-200">Enter your ZIP code and see nearby retailers with Pokémon TCG products. Only verified stock is ever shown as in stock — if a store has not been checked, it says Unknown.</p>
          <div className="mt-6 max-w-2xl rounded-lg bg-white p-4 text-slate-900"><SearchBar /></div>
          <p className="mt-3 text-sm text-slate-300">Try it: ZIP 60487, 25 miles — 4 real stores near Tinley Park, Illinois, 0 verified in-stock results (no retailer has returned verified stock yet).</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Popular tracked products</h2>
        <p className="mt-1 text-slate-600">The 20 sealed products in the catalog. Availability is Unknown until a verified retailer check.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <p className="mt-4"><Link href="/search?zip=60487&radius=25" className="font-medium text-brand-blue underline">Search all 20 products near 60487 →</Link></p>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold">Recently verified inventory</h2>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
            <p className="font-semibold">No verified stock yet.</p>
            <p className="mt-1 text-slate-600">No retailer has returned a verified inventory check. When one does, the product, store, quantity (only if the retailer provides one), and last-checked time will appear here — with its source.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Supported retailers</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {RETAILERS.map((r) => (
            <div key={r.slug} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{r.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.integration_status === 'live' ? 'bg-green-100 text-green-800' : r.integration_status === 'awaiting_credentials' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>{r.integration_status === 'live' ? 'Live' : r.integration_status === 'awaiting_credentials' ? 'Awaiting credentials' : 'Unsupported'}</span></div>
              <p className="mt-2 text-sm text-slate-600">{r.integration_notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-yellow/20">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-800">
            <li>Enter your ZIP code and a radius (5–100 miles).</li>
            <li>We find real stores near you and check verified inventory — never a listing treated as shelf stock.</li>
            <li>Watch a product and get an alert when verified availability changes to in stock. Alerts are deduped with a cooldown.</li>
            <li>The same backend powers the Discord bot: <code className="rounded bg-white px-1">/search zip:60487 radius:25</code> returns the same stores.</li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg bg-brand-blue p-8 text-white">
          <h2 className="text-2xl font-bold">Use it in Discord, too</h2>
          <p className="mt-2">The Discord bot shares this website&apos;s backend — one inventory database, no separate bot stock. Commands: /search, /stock, /nearby, /product, /watch, /unwatch, /alerts, /stores, /setzip, /watchlist, /help.</p>
          <p className="mt-2 text-sm text-blue-100">The bot is already in the test server (guild 1574893553526636624). It comes online once deployed to Railway.</p>
          <Link href="/docs" className="mt-4 inline-block rounded-md bg-white px-4 py-2 font-semibold text-brand-blue">Read the docs</Link>
        </div>
      </section>
    </div>
  );
}
