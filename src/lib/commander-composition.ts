import { CommanderCompositionTarget } from "@/lib/types";

interface CommanderCompositionInput {
  colorCount: number;
  averageManaValue: number;
  rampCount: number;
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const normalizedK = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= normalizedK; i += 1) {
    result = (result * (n - normalizedK + i)) / i;
  }
  return result;
}

function hypergeometric(totalCards: number, successCards: number, handSize: number, successes: number): number {
  if (successes > successCards || successes > handSize) return 0;
  const misses = handSize - successes;
  if (misses > totalCards - successCards) return 0;
  const numerator = combination(successCards, successes) * combination(totalCards - successCards, misses);
  const denominator = combination(totalCards, handSize);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function openingHandLandBandProbability(
  deckSize: number,
  landCount: number,
  minLands: number,
  maxLands: number,
  handSize = 7
): number {
  let probability = 0;
  for (let lands = minLands; lands <= maxLands; lands += 1) {
    probability += hypergeometric(deckSize, landCount, handSize, lands);
  }
  return probability;
}

export function getCommanderCompositionTarget(input: CommanderCompositionInput): CommanderCompositionTarget {
  const normalizedColors = Math.max(1, Math.min(5, input.colorCount));
  const rampAdjustment = input.rampCount < 8 ? 1 : input.rampCount > 12 ? -1 : 0;
  const curveAdjustment = input.averageManaValue >= 3.8 ? 2 : input.averageManaValue >= 3.4 ? 1 : 0;
  const colorAdjustment = normalizedColors >= 3 ? 1 : 0;
  const landTarget = Math.max(34, Math.min(40, 35 + rampAdjustment + curveAdjustment + colorAdjustment));

  return {
    lands: {
      min: landTarget - 2,
      max: landTarget + 2,
      target: landTarget
    },
    ramp: normalizedColors >= 3 ? 11 : 10,
    draw: normalizedColors >= 3 ? 10 : 9,
    interaction: normalizedColors >= 3 ? 11 : 10,
    boardWipes: normalizedColors >= 3 ? 3 : 2,
    finishers: 6
  };
}
