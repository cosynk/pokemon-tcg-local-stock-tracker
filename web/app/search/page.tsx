'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import StoreCard from '@/components/StoreCard';
import AvailabilityBadge from '@/components/AvailabilityBadge';
import { CATEGORIES } from '@/lib/catalog';
import type { SearchOutcome } from '@/lib/search';

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-8">Loading search…</p>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const zip = params.get('zip') ?? '60487';
  const radius = Number(params.get('radius') ?? 25);
  const [data, setData] = useState<SearchOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retailer, setRetailer] = useState(params.get('retailer') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [availability, setAvailability] = useState(params.get('availability') ?? '');
  const [sort, setSort] = useState(params.get('sort') ?? 'distance');

  useEffect(() => {
    if (!/^\d{5}$/.test(zip)) { setError('Enter a 5-digit US ZIP code.'); return; }
    setLoading(true); setError('');
    const q = new URLSearchParams({ zip, radius: String(radius), sort });
    if (retailer) q.set('retailer', retailer);
    if (category) q.set('category', category);
    if (availability) q.set('availability', availability);
    fetch(`/api/search?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Search failed. Try again.'))
      .finally(() => setLoading(false));
  }, [zip, radius, retailer, category, availability, sort]);

  const applyFilters = () => {
    const q = new URLSearchParams({ zip, radius: String(radius), sort });
    if (retailer) q.set('retailer', retailer);
    if (category) q.set('category', category);
    if (availability) q.set('availability', availability);
    router.push(`/search?${q.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Search near you</h1>
      <div className="mt-4 rounded-lg bg-slate-50 p-4"><SearchBar defaultZip={zip} defaultRadius={radius} /></div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="text-sm">Retailer <select value={retailer} onChange={(e) => setRetailer(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5"><option value="">All retailers</option><option value="best-buy">Best Buy</option><option value="target">Target</option><option value="walmart">Walmart</option><option value="gamestop">GameStop</option></select></label>
        <label className="text-sm">Category <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="text-sm">Availability <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5"><option value="">Any</option><option value="in_stock">In stock</option><option value="limited_stock">Limited stock</option><option value="out_of_stock">Out of stock</option><option value="unknown">Unknown</option><option value="last_known_in_stock">Last known in stock</option></select></label>
        <label className="text-sm">Sort <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5"><option value="distance">Distance</option><option value="recent">Recently verified</option><option value="availability">Availability</option></select></label>
        <button onClick={applyFilters} className="rounded-md bg-brand-navy px-4 py-1.5 text-sm font-semibold text-white">Apply filters</button>
      </div>

      {loading && <p className="mt-6">Searching…</p>}
      {error && <p className="mt-6 rounded bg-red-50 p-4 text-red-800">{error}</p>}
      {data && (
        <div className="mt-6">
          <p className="text-lg font-semibold">{data.stores.length} stores near {data.zip} ({data.city}, {data.state}) · {data.verified_in_stock_count} verified in-stock results</p>
          <p className="text-sm text-slate-600">Every product is Unknown until a retailer returns a verified check. A listing is never treated as shelf stock.</p>
          <div className="mt-4 grid gap-4">
            {data.stores.map((s, i) => <StoreCard key={s.id} store={s} distance={s.distance_miles} index={i} />)}
          </div>
          <h2 className="mt-8 text-xl font-bold">Products at these stores</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b"><th className="py-2">Product</th><th>Store</th><th>Distance</th><th>Availability</th><th>Last checked</th><th>Source</th></tr></thead>
              <tbody>
                {data.results.slice(0, 60).map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-2"><a href={`/product/${r.product_id}`} className="font-medium text-brand-blue underline">{r.product_name}</a><div className="text-xs text-slate-500">{r.category}</div></td>
                    <td className="py-2 pr-2">{r.store_name}</td>
                    <td className="py-2 pr-2">{r.distance_miles?.toFixed(1)} mi</td>
                    <td className="py-2 pr-2"><AvailabilityBadge availability={r.availability} /></td>
                    <td className="py-2 pr-2">{r.last_checked_at ? new Date(r.last_checked_at).toLocaleString() : 'Not checked yet'}</td>
                    <td className="py-2">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.results.length > 60 && <p className="mt-2 text-sm text-slate-500">Showing 60 of {data.results.length} product/store combinations.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
