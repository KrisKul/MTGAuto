import { describe, expect, it } from "vitest";
import { getCommanderCompositionTarget, openingHandLandBandProbability } from "@/lib/commander-composition";

describe("commander composition heuristics", () => {
  it("increases land target for high-curve, low-ramp decks", () => {
    const target = getCommanderCompositionTarget({
      colorCount: 2,
      averageManaValue: 4.1,
      rampCount: 4
    });

    expect(target.lands.target).toBeGreaterThanOrEqual(38);
  });

  it("calculates plausible opening hand land-band probability", () => {
    const lowLand = openingHandLandBandProbability(99, 31, 2, 4);
    const tunedLand = openingHandLandBandProbability(99, 37, 2, 4);

    expect(lowLand).toBeLessThan(tunedLand);
    expect(tunedLand).toBeGreaterThan(0.6);
  });
});
