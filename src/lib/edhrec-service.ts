import { Card } from "@/lib/types";

interface EdhrecAverageDeckResult {
  source: "edhrec";
  commanderSlug: string;
  rankedNames: string[];
  generatedAt: number;
}

const CACHE_TTL_MS = 1000 * 60 * 30;
const averageDeckCache = new Map<string, EdhrecAverageDeckResult>();

export function toEdhrecCommanderSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseAverageDeckCardNames(html: string): string[] {
  const headerIndex = html.toLowerCase().indexOf("average decklist");
  const content = headerIndex >= 0 ? html.slice(headerIndex) : html;
  const liMatches = [...content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  const names: string[] = [];

  for (const match of liMatches) {
    const raw = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    const cleaned = raw.replace(/^\*\s*/, "").replace(/^\d+\s+/, "").trim();
    if (!cleaned) continue;
    if (cleaned.toLowerCase().includes("average deck")) continue;
    if (cleaned.length > 70) continue;
    names.push(cleaned);
  }

  return Array.from(new Set(names)).slice(0, 120);
}

export async function fetchEdhrecAverageDeckByCommanderName(commanderName: string): Promise<EdhrecAverageDeckResult | null> {
  const commanderSlug = toEdhrecCommanderSlug(commanderName);
  const cached = averageDeckCache.get(commanderSlug);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) return cached;

  try {
    const response = await fetch(`https://edhrec.com/average-decks/${commanderSlug}`, {
      headers: { "User-Agent": "MTGAuto/0.1 (+local development)" },
      cache: "no-store"
    });
    if (!response.ok) return null;
    const html = await response.text();
    const rankedNames = parseAverageDeckCardNames(html);
    if (!rankedNames.length) return null;

    const result: EdhrecAverageDeckResult = {
      source: "edhrec",
      commanderSlug,
      rankedNames,
      generatedAt: Date.now()
    };

    averageDeckCache.set(commanderSlug, result);
    return result;
  } catch {
    return null;
  }
}

export function scoreEdhrecAffinity(card: Card, rankedNames: string[]): { boost: number; reason?: string } {
  const index = rankedNames.findIndex((name) => name.toLowerCase() === card.name.toLowerCase());
  if (index === -1) return { boost: 0 };
  if (index < 20) return { boost: 16, reason: `High EDHREC affinity (#${index + 1} in average deck).` };
  if (index < 50) return { boost: 10, reason: `Strong EDHREC affinity (#${index + 1} in average deck).` };
  return { boost: 5, reason: `Appears in EDHREC average deck (#${index + 1}).` };
}
