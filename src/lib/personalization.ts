import { UserProfile, Card } from "@/lib/types";

export function personalizeScore(baseScore: number, card: Card, profile?: UserProfile): { score: number; reasons: string[] } {
  if (!profile) return { score: baseScore, reasons: [] };

  let score = baseScore;
  const reasons: string[] = [];

  if (profile.favoriteColors?.length && card.colorIdentity.some((color) => profile.favoriteColors?.includes(color))) {
    score += 4;
    reasons.push("Matches favorite color preferences.");
  }

  if (profile.riskTolerance === "low" && card.manaValue >= 6) {
    score -= 5;
    reasons.push("Reduced for low-risk profile due to high mana value.");
  }

  if (profile.riskTolerance === "high" && card.tags.includes("finisher")) {
    score += 3;
    reasons.push("Boosted for high-risk profile and top-end preference.");
  }

  return { score, reasons };
}
