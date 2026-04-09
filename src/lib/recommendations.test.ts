import { describe, expect, it } from "vitest";
import { recommendCards } from "@/lib/recommendations";

describe("recommendCards", () => {
  it("recommends legal cards that fill gaps", () => {
    const recommendations = recommendCards({
      format: "commander",
      commanderId: "mizzix",
      entries: [
        { cardId: "island", quantity: 20 },
        { cardId: "mountain", quantity: 20 },
        { cardId: "counterspell", quantity: 1 }
      ]
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((x) => x.score > 30)).toBe(true);
    expect(recommendations.some((x) => x.reasons.some((r) => r.includes("gap")))).toBe(true);
  });
});
