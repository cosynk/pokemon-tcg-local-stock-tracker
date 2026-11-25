'use client';
import { useEffect, useState } from 'react';
import { RETAILERS } from '@/lib/catalog';

export default function AdminPage() {
  const [bb, setBb] = useState<{ status: string; detail: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function testBestBuy() {
    setTesting(true);
    try {
      const r = await fetch('/api/bestbuy');
      setBb(await r.json());
    } catch {
      setBb({ status: 'error', detail: 'Best Buy test request failed.' });
    } finally { setTesting(false); }
  }

  useEffect(() => { testBestBuy(); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin / Integrations</h1>
      <p className="mt-1 text-slate-600">Admin-only in a live deployment (Supabase Auth + an admin flag). This page shows the honest status of every integration — a placeholder is never shown as live.</p>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Retailer integrations</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Retailer</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            {RETAILERS.map((r) => (
              <tr key={r.slug} className="border-b align-top">
                <td className="py-2 font-medium">{r.name}</td>
                <td className="py-2">{r.integration_status === 'live' ? 'Live' : r.integration_status === 'awaiting_credentials' ? 'Awaiting credentials' : 'Unsupported'}</td>
                <td className="py-2 text-slate-600">{r.integration_notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-lg border p-4">
        <h2 className="text-xl font-bold">Best Buy — test key</h2>
        <p className="mt-1 text-sm text-slate-600">One lightweight Products API call. Never writes stock. Until the key is set and validated, Best Buy is Unknown.</p>
        <button onClick={testBestBuy} disabled={testing} className="mt-3 rounded-md bg-brand-blue px-4 py-2 font-semibold text-white disabled:opacity-50">{testing ? 'Testing…' : 'Test Best Buy key'}</button>
        {bb && <p className="mt-3 rounded bg-slate-50 p-3 text-sm"><strong>{bb.status}</strong> — {bb.detail}</p>}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4"><h3 className="font-bold">Inventory rows</h3><p className="mt-1 text-2xl">0</p><p className="text-sm text-slate-600">Expected until a verified retailer check writes a row. If this is not 0 before any check, stop — something seeded fake stock.</p></div>
        <div className="rounded-lg border p-4"><h3 className="font-bold">Catalog products</h3><p className="mt-1 text-2xl">20</p><p className="text-sm text-slate-600">Seeded by supabase/schema.sql.</p></div>
        <div className="rounded-lg border p-4"><h3 className="font-bold">Retailers</h3><p className="mt-1 text-2xl">8</p><p className="text-sm text-slate-600">Seeded by supabase/schema.sql.</p></div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Sync &amp; freshness</h2>
        <p className="mt-1 text-sm text-slate-600">No sync jobs have run yet. Checks older than 24h are demoted to Last known in stock, never shown as current. Alert dedupe and cooldowns are enforced server-side in the inventory engine.</p>
      </section>
    </div>
  );
}
