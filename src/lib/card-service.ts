import { CARDS } from "@/data/cards";
import { Card, Color } from "@/lib/types";

export interface CardSearchParams {
  name?: string;
  colors?: Color[];
  manaValueMin?: number;
  manaValueMax?: number;
  type?: string;
  text?: string;
  format?: "commander" | "modern" | "pioneer" | "standard";
  commanderIdentity?: Color[];
  includeExternal?: boolean;
}

const byId = new Map(CARDS.map((card) => [card.id, card]));

function getLegality(card: Card, format: "commander" | "modern" | "pioneer" | "standard") {
  return card.legalities[format] ?? "not_legal";
}

function applyFilters(cards: Card[], params: CardSearchParams): Card[] {
  return cards.filter((card) => {
    if (params.name && !card.name.toLowerCase().includes(params.name.toLowerCase())) return false;

    if (params.colors?.length) {
      const passes = params.colors.every((color) => card.colors.includes(color));
      if (!passes) return false;
    }

    if (typeof params.manaValueMin === "number" && card.manaValue < params.manaValueMin) return false;
    if (typeof params.manaValueMax === "number" && card.manaValue > params.manaValueMax) return false;

    if (params.type && !card.typeLine.toLowerCase().includes(params.type.toLowerCase())) return false;
    if (params.text && !card.oracleText?.toLowerCase().includes(params.text.toLowerCase())) return false;

    if (params.format && getLegality(card, params.format) !== "legal") return false;

    if (params.commanderIdentity?.length) {
      const identitySet = new Set(params.commanderIdentity);
      const valid = card.colorIdentity.every((color) => identitySet.has(color));
      if (!valid) return false;
    }

    return true;
  });
}

interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: Color[];
  color_identity?: Color[];
  image_uris?: { normal?: string };
  legalities: { [k: string]: "legal" | "banned" | "not_legal" };
  card_faces?: Array<{ name: string; mana_cost?: string; type_line: string; oracle_text?: string }>;
}

async function searchScryfall(params: CardSearchParams): Promise<Card[]> {
  if (!params.name && !params.text && !params.type) return [];

  const queryParts: string[] = [];
  if (params.name) queryParts.push(`name:${params.name}`);
  if (params.text) queryParts.push(`oracle:${params.text}`);
  if (params.type) queryParts.push(`type:${params.type}`);
  if (params.colors?.length) queryParts.push(`c>=${params.colors.join("")}`);
  if (typeof params.manaValueMin === "number") queryParts.push(`mv>=${params.manaValueMin}`);
  if (typeof params.manaValueMax === "number") queryParts.push(`mv<=${params.manaValueMax}`);

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryParts.join(" "))}&order=name`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: ScryfallCard[] };

    return (payload.data ?? []).slice(0, 60).map((card) => ({
      id: `scryfall-${card.id}`,
      name: card.name,
      manaCost: card.mana_cost,
      manaValue: card.cmc,
      typeLine: card.type_line,
      oracleText: card.oracle_text,
      colors: card.colors ?? [],
      colorIdentity: card.color_identity ?? [],
      legalities: {
        commander: card.legalities.commander,
        modern: card.legalities.modern,
        pioneer: card.legalities.pioneer,
        standard: card.legalities.standard
      },
      imageUri: card.image_uris?.normal,
      cardFaces: card.card_faces?.map((face) => ({
        name: face.name,
        manaCost: face.mana_cost,
        typeLine: face.type_line,
        oracleText: face.oracle_text
      })),
      tags: []
    }));
  } catch {
    return [];
  }
}

export const cardService = {
  listAll(): Card[] {
    return CARDS;
  },

  getById(id: string): Card | undefined {
    return byId.get(id);
  },

  async search(params: CardSearchParams): Promise<Card[]> {
    const local = applyFilters(CARDS, params);
    if (!params.includeExternal) return local;

    const remote = await searchScryfall(params);
    const merged = new Map<string, Card>();
    for (const card of [...local, ...remote]) merged.set(card.id, card);
    return [...merged.values()];
  }
};
