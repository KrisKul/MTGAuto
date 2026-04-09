import { cardService } from "@/lib/card-service";
import { calculateDeckAnalytics } from "@/lib/deck-analytics";
import { ConstructedFormat, DeckEntry, Recommendation, Color, DeckFormat } from "@/lib/types";

interface RecommendationInput {
  entries: DeckEntry[];
  format: DeckFormat;
  commanderId?: string | null;
  constructedFormat?: ConstructedFormat;
}

function collectRoles(entries: DeckEntry[]): Record<string, number> {
  const roles: Record<string, number> = {};
  for (const entry of entries) {
    const card = cardService.getById(entry.cardId);
    if (!card) continue;
    for (const role of card.tags) {
      roles[role] = (roles[role] ?? 0) + entry.quantity;
    }
  }
  return roles;
}

export function recommendCards(input: RecommendationInput): Recommendation[] {
  const existing = new Set(input.entries.map((entry) => entry.cardId));
  const analytics = calculateDeckAnalytics(input.entries);
  const roles = collectRoles(input.entries);

  const commander = input.commanderId ? cardService.getById(input.commanderId) : undefined;
  const allowedIdentity = new Set<Color>(commander?.colorIdentity ?? ["W", "U", "B", "R", "G"]);

  const candidates = cardService
    .listAll()
    .filter((card) => !existing.has(card.id))
    .filter((card) =>
      input.format === "commander"
        ? card.legalities.commander === "legal"
        : (card.legalities[input.constructedFormat ?? "modern"] ?? "not_legal") === "legal"
    )
    .filter((card) => card.colorIdentity.every((color) => allowedIdentity.has(color)));

  const desiredRoles = ["ramp", "draw", "removal", "land", "finisher"];

  const scored = candidates.map((card) => {
    let score = 0;
    const reasons: string[] = [];

    if (card.colorIdentity.every((color) => allowedIdentity.has(color))) {
      score += 30;
      reasons.push("Fits current color identity.");
    }

    if (analytics.cardCount > 0 && analytics.averageManaValue > 3.5 && card.manaValue <= 2) {
      score += 20;
      reasons.push("Helps lower top-heavy mana curve.");
    }

    if ((analytics.manaCurve["2"] ?? 0) < 8 && card.manaValue === 2) {
      score += 10;
      reasons.push("Adds strength to the 2-mana slot.");
    }

    for (const role of desiredRoles) {
      const hasGap = (roles[role] ?? 0) < (role === "land" ? 35 : 8);
      if (hasGap && card.tags.includes(role)) {
        score += 25;
        reasons.push(`Fills ${role} gap.`);
      }
    }

    if (card.typeLine.includes("Land") && (roles.land ?? 0) < 35) {
      score += 20;
      reasons.push("Increases land count to improve consistency.");
    }

    return { cardId: card.id, score, reasons };
  });

  return scored
    .filter((candidate) => candidate.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
