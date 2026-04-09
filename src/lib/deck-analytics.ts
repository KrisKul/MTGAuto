import { cardService } from "@/lib/card-service";
import { Card, Color, DeckEntry, DeckAnalytics } from "@/lib/types";

const colorSymbols: Color[] = ["W", "U", "B", "R", "G"];

function expand(entries: DeckEntry[]): Card[] {
  return entries.flatMap((entry) => {
    const card = cardService.getById(entry.cardId);
    if (!card) return [];
    return Array.from({ length: entry.quantity }, () => card);
  });
}

export function calculateDeckAnalytics(entries: DeckEntry[]): DeckAnalytics {
  const cards = expand(entries);
  const cardCount = cards.length;
  const manaCurve: Record<string, number> = {};
  const typeBreakdown: Record<string, number> = {};
  const colorDistribution: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

  let manaValueTotal = 0;

  for (const card of cards) {
    manaValueTotal += card.manaValue;
    const bucket = card.manaValue >= 7 ? "7+" : String(card.manaValue);
    manaCurve[bucket] = (manaCurve[bucket] ?? 0) + 1;

    const mainType = card.typeLine.split("—")[0].trim().split(" ")[0];
    typeBreakdown[mainType] = (typeBreakdown[mainType] ?? 0) + 1;

    for (const color of card.colorIdentity) {
      if (colorSymbols.includes(color)) {
        colorDistribution[color] += 1;
      }
    }
  }

  return {
    cardCount,
    averageManaValue: cardCount ? Number((manaValueTotal / cardCount).toFixed(2)) : 0,
    manaCurve,
    colorDistribution,
    typeBreakdown
  };
}
