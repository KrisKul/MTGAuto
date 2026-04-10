import { describe, expect, it, vi } from "vitest";
import { cardService } from "@/lib/card-service";
import { recommendCards } from "@/lib/recommendations";

vi.mock("@/lib/edhrec-service", () => ({
  fetchEdhrecAverageDeckByCommanderName: vi.fn(async () => null),
  scoreEdhrecAffinity: vi.fn(() => ({ boost: 0 }))
}));

describe("recommendCards", () => {
  it("recommends legal cards that fill gaps", async () => {
    const recommendations = await recommendCards({
      format: "commander",
      commanderId: "mizzix",
      entries: [
        { cardId: "island", quantity: 20 },
        { cardId: "mountain", quantity: 20 },
        { cardId: "counterspell", quantity: 1 }
      ]
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((x) => x.score > 24)).toBe(true);
    expect(recommendations.every((x) => x.confidence >= 0.1)).toBe(true);
    expect(recommendations.some((x) => x.reasons.some((r) => r.includes("coverage")))).toBe(true);
  });

  it("deprioritizes additional lands when the deck is already land-heavy", async () => {
    const recommendations = await recommendCards({
      format: "commander",
      commanderId: "infamous-cruelclaw",
      objective: "balanced",
      entries: [
        { cardId: "swamp", quantity: 45 },
        { cardId: "mountain", quantity: 45 },
        { cardId: "sol-ring", quantity: 1 }
      ]
    });

    expect(recommendations.some((x) => x.reasons.some((r) => r.includes("rebalance a land-heavy list")))).toBe(true);
    expect(
      recommendations.every((x) => {
        const card = cardService.getById(x.cardId);
        return card ? !card.typeLine.includes("Land") : true;
      })
    ).toBe(true);
  });
});
