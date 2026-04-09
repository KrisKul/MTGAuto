import { describe, expect, it } from "vitest";
import { validateDeck } from "@/lib/deck-validation";

describe("validateDeck", () => {
  it("flags commander singleton and deck size rules based on 99 + commander", () => {
    const issues = validateDeck({
      format: "commander",
      commanderId: "mizzix",
      entries: [
        { cardId: "sol-ring", quantity: 2 },
        { cardId: "island", quantity: 10 }
      ]
    });

    expect(issues.some((x) => x.message.includes("singleton"))).toBe(true);
    expect(issues.some((x) => x.message.includes("99 main-deck cards"))).toBe(true);
  });

  it("flags off-color cards in commander", () => {
    const issues = validateDeck({
      format: "commander",
      commanderId: "mizzix",
      entries: [
        { cardId: "forest", quantity: 10 },
        { cardId: "counterspell", quantity: 1 },
        { cardId: "mountain", quantity: 88 }
      ]
    });

    expect(issues.some((x) => x.message.includes("violates commander's color identity"))).toBe(true);
  });

  it("allows commander exceptions with explicit canBeCommander support", () => {
    const issues = validateDeck({
      format: "commander",
      commanderId: "tevesh-szat",
      entries: [{ cardId: "swamp", quantity: 99 }]
    });

    expect(issues.some((x) => x.message.includes("not commander-legal"))).toBe(false);
  });

  it("validates constructed minimum size and 4-copy limit", () => {
    const issues = validateDeck({
      format: "constructed",
      constructedFormat: "modern",
      minDeckSize: 60,
      entries: [{ cardId: "counterspell", quantity: 5 }]
    });

    expect(issues.some((x) => x.message.includes("at least 60"))).toBe(true);
    expect(issues.some((x) => x.message.includes("exceeds 4-copy"))).toBe(true);
  });
});
