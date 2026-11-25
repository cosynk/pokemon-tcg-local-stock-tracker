import { NextResponse } from 'next/server';
import { validateBestBuyKey, bestBuyStatus } from '@/lib/retailers/bestbuy';

// GET /api/bestbuy — Admin "Test key" (validateBestBuyKey).
// One lightweight Products call. Never writes stock. Returns the honest
// status: key_not_configured / connected / invalid_key / error.
export async function GET() {
  const result = await validateBestBuyKey();
  return NextResponse.json({ status: result.status, detail: result.detail, configured: bestBuyStatus() !== 'key_not_configured' });
}
