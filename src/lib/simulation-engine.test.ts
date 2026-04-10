import { describe, expect, it } from "vitest";
import { simulateDeck } from "@/lib/simulation-engine";

describe("simulation engine", () => {
  it("reports stable keep rates for a basic-land heavy shell", () => {
    const summary = simulateDeck(
      [
        { cardId: "swamp", quantity: 19 },
        { cardId: "mountain", quantity: 18 },
        { cardId: "terminate", quantity: 30 },
        { cardId: "bedevil", quantity: 20 },
        { cardId: "arcane-signet", quantity: 6 },
        { cardId: "read-the-bones", quantity: 6 }
      ],
      200
    );

    expect(summary.openingHandKeepRate).toBeGreaterThan(0.5);
    expect(summary.manaScrewRate).toBeLessThan(0.5);
  });
});
