import Link from 'next/link';
import type { Product } from '@/lib/types';
import AvailabilityBadge from './AvailabilityBadge';

export default function ProductCard({ product, availability = 'unknown' }: { product: Product; availability?: 'in_stock' | 'limited_stock' | 'out_of_stock' | 'unknown' | 'last_known_in_stock' }) {
  return (
    <Link href={`/product/${product.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-blue hover:shadow">
      <div className="flex h-24 items-center justify-center rounded-md bg-brand-navy text-4xl font-black text-brand-yellow">
        {product.name.replace('Pokémon TCG: ', '').slice(0, 2).toUpperCase()}
      </div>
      <h3 className="mt-3 font-semibold leading-snug">{product.name}</h3>
      <p className="text-sm text-slate-600">{product.set_name} · {product.category}</p>
      <div className="mt-2"><AvailabilityBadge availability={availability} /></div>
      <p className="mt-2 text-xs text-slate-500">Image via TCGdex on the product page. Availability is Unknown until a retailer returns a verified check.</p>
    </Link>
  );
}
