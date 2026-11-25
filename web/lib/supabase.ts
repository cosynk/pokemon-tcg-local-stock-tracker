// Supabase browser client. Safe to import from Client Components.
// All env vars are optional at build time: when the Supabase project is
// not configured yet, this returns null and the app falls back to the
// local catalog / store seed (no fake stock).
// Never put a service-role key in client code.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
