import { MetagameSnapshot } from "@/lib/types";

export function matchupPressureScore(snapshot: MetagameSnapshot | undefined): number {
  if (!snapshot?.matchups.length) return 0;
  const weightedLoss = snapshot.matchups.reduce((acc, row) => acc + row.sampleSize * (1 - row.winRate), 0);
  const totalSamples = snapshot.matchups.reduce((acc, row) => acc + row.sampleSize, 0);
  if (!totalSamples) return 0;
  return weightedLoss / totalSamples;
}

export function matchupReason(snapshot: MetagameSnapshot | undefined): string | null {
  if (!snapshot?.matchups.length) return null;
  const worst = [...snapshot.matchups].sort((a, b) => a.winRate - b.winRate)[0];
  return `Meta pressure detected vs ${worst.archetype} (${Math.round(worst.winRate * 100)}% win rate).`;
}
