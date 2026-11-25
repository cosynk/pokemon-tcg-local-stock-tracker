'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ defaultZip = '60487', defaultRadius = 25 }: { defaultZip?: string; defaultRadius?: number }) {
  const router = useRouter();
  const [zip, setZip] = useState(defaultZip);
  const [radius, setRadius] = useState(defaultRadius);
  const [error, setError] = useState('');
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\d{5}$/.test(zip.trim())) { setError('Enter a 5-digit US ZIP code.'); return; }
        setError('');
        router.push(`/search?zip=${zip.trim()}&radius=${radius}`);
      }}
    >
      <label className="sr-only" htmlFor="zip">ZIP code</label>
      <input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" maxLength={5} placeholder="ZIP code, e.g. 60487" className="flex-1 rounded-md border border-slate-300 px-4 py-3 text-base" />
      <label className="sr-only" htmlFor="radius">Radius</label>
      <select id="radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="rounded-md border border-slate-300 px-3 py-3">
        {[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>{r} miles</option>)}
      </select>
      <button type="submit" className="rounded-md bg-brand-red px-6 py-3 font-semibold text-white hover:bg-brand-darkred">Search stock</button>
      {error && <p className="text-sm text-red-700 sm:w-full">{error}</p>}
    </form>
  );
}
