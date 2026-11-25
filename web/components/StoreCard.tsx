import Link from 'next/link';
import type { Store } from '@/lib/types';

export default function StoreCard({ store, distance, index }: { store: Store; distance: number; index: number }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)}`;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">{index + 1}</span>{store.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{store.address}, {store.city}, {store.state} {store.zip}</p>
          <p className="text-sm text-slate-600">{distance.toFixed(1)} mi away · {store.retailer_name}{store.phone ? ` · ${store.phone}` : ''}</p>
          {store.location_note && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{store.location_note}</p>}
        </div>
        <Link href={`/store/${store.id}`} className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-brand-blue">Details</Link>
      </div>
      <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand-blue underline">Directions</a>
    </article>
  );
}
