'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase';
import { PRODUCTS } from '@/lib/catalog';

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Array<{ product_id: string }>>([]);
  const [note, setNote] = useState('');
  const [savedZips, setSavedZips] = useState<string[]>(['60487']);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) { setNote('Supabase is not configured yet — sign-in, saved ZIPs, and watchlists are unavailable until NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set and supabase/schema.sql has run.'); return; }
    sb.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => setUserEmail(data.user?.email ?? null));
    fetch('/api/watchlist').then((r) => r.json()).then((d) => {
      if (Array.isArray(d.watchlist)) setWatchlist(d.watchlist);
      if (d.note) setNote(d.note);
    }).catch(() => undefined);
  }, []);

  async function signOut() {
    const sb = getSupabaseBrowser();
    await sb?.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {!supabaseConfigured && <p className="mt-4 rounded bg-yellow-50 p-4 text-yellow-800">{note}</p>}
      {supabaseConfigured && !userEmail && <p className="mt-4">You are not signed in. <Link href="/login" className="font-medium text-brand-blue underline">Sign in</Link> to see your saved ZIPs, watchlist, and alerts.</p>}
      {userEmail && <p className="mt-2 text-slate-600">Signed in as {userEmail} · <button onClick={signOut} className="text-brand-blue underline">Sign out</button></p>}

      <section className="mt-8">
        <h2 className="text-xl font-bold">Saved ZIP codes</h2>
        <ul className="mt-2 flex gap-2">{savedZips.map((z) => <li key={z}><Link href={`/search?zip=${z}&radius=25`} className="rounded-full border border-slate-300 px-3 py-1 text-sm">{z} (25 mi)</Link></li>)}</ul>
        <p className="mt-2 text-sm text-slate-500">Multiple ZIPs are supported — save more once Supabase is connected.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Watched products</h2>
        {watchlist.length === 0 ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700">No watched products yet. Open a product and tap Watch. No alert fires while availability is Unknown.</p>
        ) : (
          <ul className="mt-2 space-y-2">{watchlist.map((w) => <li key={w.product_id} className="rounded border p-3">{PRODUCTS.find((p) => p.id === w.product_id)?.name ?? w.product_id}</li>)}</ul>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4"><h2 className="font-bold">Favorite stores</h2><p className="mt-1 text-sm text-slate-600">No favorite stores yet. Favorite a store from its detail page once signed in.</p></div>
        <div className="rounded-lg border p-4"><h2 className="font-bold">Active stock alerts</h2><p className="mt-1 text-sm text-slate-600">No active alerts. Alerts fire only on a verified unavailable → available change, deduped with a per-watch cooldown.</p></div>
        <div className="rounded-lg border p-4"><h2 className="font-bold">Notification history</h2><p className="mt-1 text-sm text-slate-600">No notifications yet.</p></div>
        <div className="rounded-lg border p-4"><h2 className="font-bold">Account &amp; Discord linking</h2><p className="mt-1 text-sm text-slate-600">Link Discord from here once Supabase is connected: the site shows a one-time code, then run /link &lt;code&gt; in Discord. Linking is not required for public search.</p></div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Recently viewed</h2>
        <p className="mt-1 text-sm text-slate-600">Your recent ZIP searches will appear here once signed in.</p>
      </section>
    </div>
  );
}
