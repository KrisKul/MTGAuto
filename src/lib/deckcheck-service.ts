interface DeckCheckOptions {
  apiBase?: string;
  apiKey?: string;
}

const defaultApiBase = process.env.DECKCHECK_API_BASE ?? "https://deckcheck.co/api/external";

function buildHeaders(apiKey?: string): HeadersInit {
  if (!apiKey) return {};
  return { "X-Api-Key": apiKey };
}

export async function fetchDeckCheckDeck(params: { deckId?: string; deckUrl?: string }, options?: DeckCheckOptions) {
  const apiBase = options?.apiBase ?? defaultApiBase;
  const apiKey = options?.apiKey ?? process.env.DECKCHECK_API_KEY;

  const search = new URLSearchParams();
  if (params.deckId) search.set("deck_id", params.deckId);
  if (params.deckUrl) search.set("deck_url", params.deckUrl);

  const response = await fetch(`${apiBase}/deck?${search.toString()}`, {
    headers: buildHeaders(apiKey),
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeckCheck deck request failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function fetchDeckCheckSearch(
  params: Record<string, string | number | boolean | undefined>,
  options?: DeckCheckOptions
) {
  const apiBase = options?.apiBase ?? defaultApiBase;
  const apiKey = options?.apiKey ?? process.env.DECKCHECK_API_KEY;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const response = await fetch(`${apiBase}/deck-search?${search.toString()}`, {
    headers: buildHeaders(apiKey),
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeckCheck deck-search request failed (${response.status}): ${body}`);
  }

  return response.json();
}
