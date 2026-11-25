import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pokémon TCG Local Stock Tracker — Find Pokémon cards near you',
  description: 'Enter your ZIP code and discover nearby retailers with Pokémon TCG products. Verified stock only — Unknown is never shown as In stock.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white text-sm font-black">P</span>
              <span>Pokémon TCG <span className="text-brand-red">Stock Tracker</span></span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
              <Link href="/search" className="hover:text-brand-red">Search</Link>
              <Link href="/dashboard" className="hover:text-brand-red">Dashboard</Link>
              <Link href="/admin" className="hover:text-brand-red">Admin</Link>
              <Link href="/docs" className="hover:text-brand-red">Docs</Link>
              <Link href="/login" className="rounded-md bg-brand-blue px-3 py-1.5 text-white hover:bg-blue-800">Sign in</Link>
            </nav>
          </div>
        </header>
        <main className="min-h-[70vh]">{children}</main>
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Pokémon TCG Local Stock Tracker</p>
            <p className="mt-1">Verified stock only. Unknown is never shown as In stock. Catalog data: TCGdex. Store locations: retailer locators / OpenStreetMap.</p>
            <p className="mt-1">Pokémon and Pokémon character names are trademarks of Nintendo. This tracker is not affiliated with Nintendo, The Pokémon Company, or any retailer.</p>
            <p className="mt-3"><Link href="/docs" className="text-brand-blue underline">Docs &amp; deployment guide</Link> · <Link href="/admin" className="text-brand-blue underline">Admin / Integrations</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
