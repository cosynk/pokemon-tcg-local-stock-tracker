// TCGdex catalog client — catalog data only (names / images), NEVER stock.
// Free, no key: https://api.tcgdex.net/v2/en
// pokemontcg.io is deprecated and issues no new keys — do not use it.
export interface TcgdexCard { id: string; name: string; image?: string }

export async function fetchTcgdexCardImage(productName: string): Promise<string | null> {
  // Strip the "Pokémon TCG: " prefix and set suffixes for a card-name search.
  const query = productName.replace(/^Pokémon TCG:\s*/i, '').replace(/Elite Trainer Box|Booster Box|Booster Bundle|Booster Pack|Super-Premium Collection|Premium Collection|Tin$/i, '').trim();
  try {
    const res = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } } as RequestInit,
    );
    if (!res.ok) return null;
    const cards = (await res.json()) as TcgdexCard[];
    const withImage = cards.find((c) => c.image);
    if (!withImage?.image) return null;
    // TCGdex images are returned as ".../low.png" style paths; use the
    // high-res variant when the pattern allows, else the returned URL.
    return withImage.image.replace('/low.', '/high.').replace('http://', 'https://');
  } catch {
    return null;
  }
}

export async function fetchTcgdexSet(setId: string): Promise<{ name: string; logo?: string } | null> {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(setId)}`, {
      headers: { Accept: 'application/json' }, next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return null;
    return (await res.json()) as { name: string; logo?: string };
  } catch {
    return null;
  }
}
