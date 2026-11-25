import { NextRequest, NextResponse } from 'next/server';
import { loadVerifiedInventory, demoteIfStale } from '@/lib/search';
import { findProduct } from '@/lib/catalog';
import { findStore } from '@/lib/stores';

// GET /api/inventory?product_id=...&store_id=...
// Returns verified inventory rows only. With no verified rows, the result
// is an empty list and availability "unknown" — never invented stock.
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id') ?? '';
  const storeId = req.nextUrl.searchParams.get('store_id') ?? '';
  const verified = await loadVerifiedInventory();
  const rows = [...verified.values()]
    .filter((r) => (!productId || r.product_id === productId) && (!storeId || r.store_id === storeId))
    .map((r) => ({
      ...r,
      availability: demoteIfStale(r.availability, r.last_checked_at),
      product_name: findProduct(r.product_id)?.name ?? r.product_id,
      store_name: findStore(r.store_id)?.name ?? r.store_id,
    }));
  return NextResponse.json({ rows, count: rows.length, note: rows.length === 0 ? 'No verified inventory rows yet. Availability is Unknown until a retailer check writes a row.' : undefined });
}
