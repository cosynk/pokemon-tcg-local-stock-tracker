'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase';
import { PRODUCTS } from '@/lib/catalog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    const sb = getSupabaseBrowser();
    if (!sb) { setError('Supabase Auth is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, and enable Google in Supabase → Authentication → Providers.'); return; }
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
    if (error) setError(error.message);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabaseBrowser();
    if (!sb) { setError('Supabase Auth is not configured yet.'); return; }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { setMessage('Signed in. Redirecting to your dashboard…'); window.location.href = '/dashboard'; }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabaseBrowser();
    if (!sb) { setError('Supabase Auth is not configured yet.'); return; }
    const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
    if (error) setError(error.message);
    else setMessage('Check your email to confirm your account, then sign in.');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-1 text-slate-600">Google OAuth or email + password, via Supabase Auth. Passwords are hashed by Supabase; the tracker never stores them.</p>
      {!supabaseConfigured && <p className="mt-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">Supabase is not configured on this deployment yet, so sign-in is unavailable. Set the Supabase env vars and run supabase/schema.sql first.</p>}
      <button onClick={signInWithGoogle} className="mt-6 w-full rounded-md border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50">Continue with Google</button>
      <form onSubmit={signInWithEmail} className="mt-6 space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-slate-300 px-4 py-3" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-md border border-slate-300 px-4 py-3" />
        <button type="submit" className="w-full rounded-md bg-brand-blue px-4 py-3 font-semibold text-white">Sign in with email</button>
        <button type="button" onClick={signUp} className="w-full rounded-md border border-slate-300 px-4 py-3 font-semibold">Create account</button>
      </form>
      {message && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="mt-6 text-sm text-slate-500">Signed-in features: saved ZIPs, favorite stores, watchlist, stock alerts, notification history. Public ZIP search works without signing in.</p>
    </div>
  );
}
