import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfigured } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { findProduct } from '@/lib/catalog';

// Watchlist is per-user and requires sign-in (Supabase Auth).
// Without Supabase configured, the route explains that honestly instead
// of pretending to save anything.
export async function GET() {
  if (!supabaseConfigured) {
    return NextResponse.json({ watchlist: [], configured: false, note: 'Supabase Auth is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, run supabase/schema.sql, and sign in.' });
  }
  const sb = getSupabaseServer();
  const { data: { user } } = await sb!.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { data, error } = await sb!.from('watchlists').select('*').eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlist: data ?? [], configured: true });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 503 });
  const sb = getSupabaseServer();
  const { data: { user } } = await sb!.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = (await req.json()) as { product_id?: string; zip?: string; radius_miles?: number };
  if (!body.product_id || !findProduct(body.product_id)) {
    return NextResponse.json({ error: 'product_id must be a tracked product id' }, { status: 400 });
  }
  // Map the Supabase Auth user to the app users row by email.
  const { data: appUser } = await sb!.from('users').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!appUser) return NextResponse.json({ error: 'Account not set up yet. Sign in once on the website to create your profile.' }, { status: 400 });
  const { error } = await sb!.from('watchlists').upsert({
    user_id: (appUser as { id: string }).id,
    product_id: body.product_id,
    zip: body.zip ?? null,
    radius_miles: body.radius_miles ?? 25,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 503 });
  const sb = getSupabaseServer();
  const { data: { user } } = await sb!.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const productId = req.nextUrl.searchParams.get('product_id') ?? '';
  const { data: appUser } = await sb!.from('users').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (!appUser) return NextResponse.json({ error: 'Account not set up yet.' }, { status: 400 });
  await sb!.from('watchlists').delete().eq('user_id', (appUser as { id: string }).id).eq('product_id', productId);
  return NextResponse.json({ ok: true });
}
