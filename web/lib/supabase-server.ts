// Supabase server clients — SERVER ONLY. Do not import from Client
// Components (this file imports next/headers).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey, supabaseConfigured } from './supabase';

export function getSupabaseServer(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* read-only in Server Components */ }
      },
    },
  });
}

/** Server-side client with the service-role key (API routes / sync jobs only). */
export function getSupabaseService(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}
