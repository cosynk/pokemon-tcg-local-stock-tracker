import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';
  if (code && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const res = NextResponse.redirect(new URL(next, req.url));
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) { cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
      },
    });
    await sb.auth.exchangeCodeForSession(code);
    return res;
  }
  return NextResponse.redirect(new URL('/login?error=auth_not_configured', req.url));
}
