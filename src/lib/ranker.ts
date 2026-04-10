const feedbackWeights = new Map<string, number>();

export function registerRecommendationFeedback(cardId: string, accepted: boolean): void {
  const current = feedbackWeights.get(cardId) ?? 0;
  feedbackWeights.set(cardId, current + (accepted ? 1 : -1));
}

export function feedbackScore(cardId: string): number {
  const raw = feedbackWeights.get(cardId) ?? 0;
  return Math.max(-8, Math.min(8, raw));
}
