// Discord command handling — the exact contract bot/bot.py expects.
// Input: a command string like "search zip:60487 radius:25"
// Output: { title, lines[], footer?, image_url? }
// The bot only renders this; it never invents stock. Unknown stays Unknown.
import { PRODUCTS, RETAILERS } from './catalog';
import { runSearch } from './search';
import { AVAILABILITY_LABELS } from './types';
import { bestBuyStatus } from './retailers/bestbuy';

function kv(input: string, key: string): string | null {
  const m = input.match(new RegExp(`${key}:([^\\s]+)`, 'i'));
  return m ? m[1] : null;
}

export async function runDiscordCommand(input: string): Promise<{ title: string; lines: string[]; footer?: string; image_url?: string }> {
  const raw = input.trim();
  const [cmd, ...rest] = raw.split(/\s+/);
  const command = (cmd ?? '').toLowerCase();
  const args = rest.join(' ');

  if (command === 'help' || command === '') {
    return {
      title: 'Pokémon TCG Local Stock Tracker',
      lines: [
        '/search zip:60487 radius:25 — products near a ZIP',
        '/stock <product> — verified availability of one product',
        '/nearby zip:60487 radius:25 — stores near a ZIP',
        '/product <product> — product details',
        '/watch <product> — watch for restocks (sign in on the website first)',
        '/unwatch <product> — stop watching',
        '/alerts <website|discord|email> — alert channel',
        '/stores [zip:60487] — supported retailers',
        '/setzip zip:60487 — save your ZIP',
        '/watchlist — your watched products',
        '/link [code] — link your Discord account to the website',
        'Availability is only ever verified stock. Unknown is never shown as In stock.',
      ],
      footer: 'Website + bot share one backend and one inventory database.',
    };
  }

  if (command === 'search' || command === 'nearby') {
    const zip = kv(args, 'zip') ?? kv(raw, 'zip') ?? '60487';
    const radius = Number(kv(args, 'radius') ?? kv(raw, 'radius') ?? 25);
    if (!/^\d{5}$/.test(zip)) return { title: 'Invalid ZIP', lines: ['Please use a 5-digit ZIP code, e.g. /search zip:60487 radius:25.'] };
    if (![5, 10, 25, 50, 100].includes(radius)) return { title: 'Invalid radius', lines: ['Radius must be 5, 10, 25, 50, or 100 miles.'] };
    try {
      const out = await runSearch({ zip, radius });
      const lines = out.stores.map((s, i) => `${i + 1}. ${s.name} — ${s.address}, ${s.city}, ${s.state} ${s.zip} (${s.distance_miles.toFixed(1)} mi) — ${s.retailer_name}`);
      lines.push('', `${out.verified_in_stock_count} verified in-stock results. Every product at these stores is currently Unknown — no retailer has returned verified stock yet.`);
      return { title: `${out.stores.length} stores near ${zip} (${out.city}, ${out.state})`, lines, footer: 'Source: retailer store locators / OpenStreetMap. Stock: not yet checked — Unknown, not In stock.' };
    } catch (e) {
      return { title: 'Search failed', lines: [e instanceof Error ? e.message : 'Could not search that ZIP.'], footer: 'No inventory was checked.' };
    }
  }

  if (command === 'stock' || command === 'product') {
    const q = args.trim();
    const product = PRODUCTS.find((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.id === q.toLowerCase());
    if (!q || !product) {
      return { title: 'Product not found', lines: [`No tracked product matches "${q}".`, 'Try a tracked product, e.g. "Mega Evolution Elite Trainer Box".'], footer: 'Tracked catalog: 20 sealed products.' };
    }
    return {
      title: product.name,
      lines: [
        `Set: ${product.set_name}`,
        `Category: ${product.category}`,
        'Availability: Unknown — no retailer has returned a verified check for this product yet.',
        'SKU: not available — only shown when a verified source provides one.',
      ],
      footer: 'Source: TCGdex catalog (names only, not stock).',
    };
  }

  if (command === 'stores') {
    const lines = RETAILERS.map((r) => {
      const status = r.integration_status === 'live' ? 'Live' : r.integration_status === 'awaiting_credentials' ? 'Awaiting credentials' : 'Unsupported';
      return `• ${r.name} — ${status}: ${r.integration_notes}`;
    });
    lines.push('', `Best Buy adapter: ${bestBuyStatus() === 'connected' ? 'key configured' : 'key not configured — Unknown until the key arrives'}.`);
    return { title: 'Supported retailers', lines, footer: 'Unsupported means no verified inventory is available from that retailer.' };
  }

  if (command === 'watch' || command === 'unwatch') {
    return { title: command === 'watch' ? 'Watchlist' : 'Watchlist', lines: ['Watchlists live on the website, signed in with your account.', command === 'watch' ? 'Sign in on the website, open a product, and tap Watch. Discord alerts need your Discord account linked from the dashboard.' : 'Sign in on the website dashboard to remove a watched product.'], footer: 'No alert fires while availability is Unknown.' };
  }

  if (command === 'alerts') {
    return { title: 'Stock alerts', lines: ['Alerts fire only when verified availability changes from unavailable to available.', 'Set your channel on the website dashboard: website, Discord, or email. Alerts are deduped with a per-watch cooldown.'], footer: 'No alert fires while availability is Unknown.' };
  }

  if (command === 'setzip') {
    const zip = kv(args, 'zip') ?? args.trim();
    if (!/^\d{5}$/.test(zip)) return { title: 'Invalid ZIP', lines: ['Please use a 5-digit ZIP code, e.g. /setzip zip:60487.'] };
    return { title: 'ZIP saved (website)', lines: [`ZIP ${zip} is your preferred search ZIP on the website dashboard.`, 'Sign in on the website to save it to your account.'], footer: 'Public /search works without signing in.' };
  }

  if (command === 'watchlist') {
    return { title: 'Your watchlist', lines: ['Your watchlist lives on the website dashboard (sign in required).', 'No products are watched yet from Discord alone — open a product on the website and tap Watch.'], footer: 'Users only see their own watchlist rows.' };
  }

  if (command === 'link') {
    return { title: 'Link your Discord account', lines: ['On the website dashboard, tap Link Discord to get a one-time code, then run /link <code> here.', 'Linking is not required for public /search, /stock, /nearby, /stores, or /help.'], footer: 'The website never stores the bot token.' };
  }

  return { title: 'Unknown command', lines: [`"${command}" is not a tracker command.`, 'Run /help for the full list.'], footer: 'Available: search, stock, nearby, product, watch, unwatch, alerts, stores, setzip, watchlist, link, help.' };
}
