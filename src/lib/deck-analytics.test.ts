import { describe, expect, it } from "vitest";
import { calculateDeckAnalytics } from "@/lib/deck-analytics";

describe("calculateDeckAnalytics", () => {
  it("calculates counts, curve, colors, and average mana value", () => {
    const analytics = calculateDeckAnalytics([
      { cardId: "counterspell", quantity: 2 },
      { cardId: "island", quantity: 3 },
      { cardId: "llanowar-elves", quantity: 1 }
    ]);

    expect(analytics.cardCount).toBe(6);
    expect(analytics.manaCurve["2"]).toBe(2);
    expect(analytics.manaCurve["0"]).toBe(3);
    expect(analytics.colorDistribution.U).toBeGreaterThan(0);
    expect(analytics.averageManaValue).toBeCloseTo(0.83, 2);
  });
});
