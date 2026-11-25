import { NextRequest, NextResponse } from 'next/server';
import { runSearch } from '@/lib/search';

const RADII = [5, 10, 25, 50, 100];

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip') ?? '';
  const radius = Number(req.nextUrl.searchParams.get('radius') ?? 25);
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'zip must be a 5-digit US ZIP code' }, { status: 400 });
  }
  if (!RADII.includes(radius)) {
    return NextResponse.json({ error: 'radius must be 5, 10, 25, 50, or 100' }, { status: 400 });
  }
  try {
    const out = await runSearch({
      zip,
      radius,
      retailer: req.nextUrl.searchParams.get('retailer') ?? undefined,
      category: req.nextUrl.searchParams.get('category') ?? undefined,
      availability: req.nextUrl.searchParams.get('availability') ?? undefined,
      sort: (req.nextUrl.searchParams.get('sort') as 'distance' | 'recent' | 'availability' | null) ?? 'distance',
      product: req.nextUrl.searchParams.get('product') ?? undefined,
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed' }, { status: 502 });
  }
}
