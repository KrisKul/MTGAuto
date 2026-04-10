import { cardService } from "@/lib/card-service";
import { calculateDeckAnalytics } from "@/lib/deck-analytics";
import { getCommanderCompositionTarget, openingHandLandBandProbability } from "@/lib/commander-composition";
import { fetchEdhrecAverageDeckByCommanderName, scoreEdhrecAffinity } from "@/lib/edhrec-service";
import { inferCardRoles } from "@/lib/role-ontology";
import { feedbackScore } from "@/lib/ranker";
import { matchupPressureScore, matchupReason } from "@/lib/metagame-engine";
import { personalizeScore } from "@/lib/personalization";
import { simulateDeck } from "@/lib/simulation-engine";
import {
  ConstructedFormat,
  DeckEntry,
  Recommendation,
  RecommendationObjective,
  Color,
  DeckFormat,
  MetagameSnapshot,
  UserProfile
} from "@/lib/types";

interface RecommendationInput {
  entries: DeckEntry[];
  format: DeckFormat;
  commanderId?: string | null;
  constructedFormat?: ConstructedFormat;
  objective?: RecommendationObjective;
  metagame?: MetagameSnapshot;
  userProfile?: UserProfile;
}

const objectiveWeights: Record<RecommendationObjective, { curve: number; interaction: number; ramp: number; value: number }> = {
  balanced: { curve: 1, interaction: 1, ramp: 1, value: 1 },
  consistency: { curve: 1.15, interaction: 0.85, ramp: 1.25, value: 1.1 },
  vs_aggro: { curve: 1.1, interaction: 1.4, ramp: 0.9, value: 0.95 },
  budget: { curve: 1.05, interaction: 1, ramp: 1.05, value: 1.15 }
};

function collectRoles(entries: DeckEntry[]): Record<string, number> {
  const roles: Record<string, number> = {};
  for (const entry of entries) {
    const card = cardService.getById(entry.cardId);
    if (!card) continue;
    for (const role of card.tags) {
      roles[role] = (roles[role] ?? 0) + entry.quantity;
    }
  }
  return roles;
}

function collectPips(entries: DeckEntry[]): Record<Color, number> {
  const pips: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const colors: Color[] = ["W", "U", "B", "R", "G"];
  for (const entry of entries) {
    const card = cardService.getById(entry.cardId);
    if (!card?.manaCost) continue;
    for (const color of colors) {
      const matches = card.manaCost.match(new RegExp(`\\{${color}\\}`, "g"));
      pips[color] += (matches?.length ?? 0) * entry.quantity;
    }
  }
  return pips;
}

export async function recommendCards(input: RecommendationInput): Promise<Recommendation[]> {
  const existing = new Set(input.entries.map((entry) => entry.cardId));
  const analytics = calculateDeckAnalytics(input.entries);
  const roles = collectRoles(input.entries);
  const pips = collectPips(input.entries);
  const objective = input.objective ?? "balanced";
  const weights = objectiveWeights[objective];

  const commander = input.commanderId ? cardService.getById(input.commanderId) : undefined;
  const allowedIdentity = new Set<Color>(commander?.colorIdentity ?? ["W", "U", "B", "R", "G"]);

  const compositionTarget =
    input.format === "commander"
      ? getCommanderCompositionTarget({
          colorCount: allowedIdentity.size,
          averageManaValue: analytics.averageManaValue,
          rampCount: roles.ramp ?? 0
        })
      : null;

  const currentLandCount = roles.land ?? 0;
  const deckSize = input.format === "commander" ? 99 : Math.max(60, analytics.cardCount);
  const currentKeepableHandProbability = openingHandLandBandProbability(deckSize, currentLandCount, 2, 4);
  const simulation = simulateDeck(input.entries);
  const metaPressure = matchupPressureScore(input.metagame);
  const metaReason = matchupReason(input.metagame);
  const roleTargets: Record<string, number> = {
    land: compositionTarget?.lands.target ?? 24,
    ramp: compositionTarget?.ramp ?? 8,
    draw: compositionTarget?.draw ?? 8,
    interaction: compositionTarget?.interaction ?? 8,
    removal: compositionTarget?.interaction ?? 8,
    boardwipe: compositionTarget?.boardWipes ?? 2,
    finisher: compositionTarget?.finishers ?? 6
  };

  const candidates = cardService
    .listAll()
    .filter((card) => !existing.has(card.id))
    .filter((card) =>
      input.format === "commander"
        ? card.legalities.commander === "legal"
        : (card.legalities[input.constructedFormat ?? "modern"] ?? "not_legal") === "legal"
    )
    .filter((card) => card.colorIdentity.every((color) => allowedIdentity.has(color)));
  const edhrecSignal = commander ? await fetchEdhrecAverageDeckByCommanderName(commander.name) : null;

  const scored = candidates.map((card) => {
    let score = 0;
    const reasons: string[] = [];
    const tradeoffs: string[] = [];

    if (card.colorIdentity.every((color) => allowedIdentity.has(color))) {
      score += 24;
      reasons.push("Fits current color identity.");
    }

    if (edhrecSignal) {
      const affinity = scoreEdhrecAffinity(card, edhrecSignal.rankedNames);
      score += affinity.boost;
      if (affinity.reason) reasons.push(affinity.reason);
    }

    const dominantPipColor = (Object.entries(pips) as Array<[Color, number]>)
      .sort((a, b) => b[1] - a[1])
      .find(([, count]) => count > 0)?.[0];
    if (dominantPipColor && (card.tags.includes("fixing") || card.typeLine.includes("Land")) && card.colorIdentity.includes(dominantPipColor)) {
      score += 8;
      reasons.push(`Supports ${dominantPipColor}-heavy mana requirements.`);
    }

    const inferredRoles = inferCardRoles(card);
    for (const [role, target] of Object.entries(roleTargets)) {
      if (!inferredRoles.includes(role)) continue;
      const current = roles[role] ?? 0;
      const deficitRatio = Math.max(0, (target - current) / Math.max(1, target));
      if (deficitRatio > 0) {
        const roleWeight = role === "interaction" || role === "removal" ? weights.interaction : role === "ramp" ? weights.ramp : weights.value;
        score += Math.round(20 * deficitRatio * roleWeight);
        reasons.push(`Improves ${role} coverage (${current}/${target}).`);
      }
    }

    if (analytics.averageManaValue > 3.6 && card.manaValue <= 2) {
      score += Math.round(16 * weights.curve);
      reasons.push("Improves early-game velocity for a high-curve list.");
    }

    if ((analytics.manaCurve["2"] ?? 0) < 8 && card.manaValue === 2) {
      score += Math.round(10 * weights.curve);
      reasons.push("Strengthens the critical 2-mana slot.");
    }

    if (card.typeLine.includes("Land")) {
      const nextLandProbability = openingHandLandBandProbability(deckSize, currentLandCount + 1, 2, 4);
      const delta = nextLandProbability - currentKeepableHandProbability;
      if (currentLandCount < (compositionTarget?.lands.min ?? 22)) {
        score += Math.round((14 + Math.max(0, delta * 100)) * weights.ramp);
        reasons.push(`Raises keepable opener odds (${Math.round(currentKeepableHandProbability * 100)}% → ${Math.round(nextLandProbability * 100)}%).`);
      }
      if (currentLandCount >= (compositionTarget?.lands.max ?? 27)) {
        score -= 36;
        tradeoffs.push("Deck is already land-heavy; this may reduce spell quality density.");
      }
    } else if (currentLandCount >= (compositionTarget?.lands.max ?? 27)) {
      score += 14;
      reasons.push("Helps rebalance a land-heavy list.");
    }

    if (objective === "budget" && card.manaValue <= 3) {
      score += 6;
      tradeoffs.push("Budget mode currently approximates value with lower mana-value cards (price feed pending).");
    }

    if (metaPressure > 0.52 && (inferredRoles.includes("interaction") || inferredRoles.includes("removal"))) {
      score += 8;
      if (metaReason) reasons.push(metaReason);
    }

    if (simulation.turn2InteractionRate < 0.55 && inferredRoles.includes("interaction")) {
      score += 10;
      reasons.push("Simulation shows low turn-2 interaction access; this helps stabilize early turns.");
    }

    score += feedbackScore(card.id);
    if (feedbackScore(card.id) > 0) reasons.push("Historically accepted recommendation in prior tuning sessions.");
    if (feedbackScore(card.id) < 0) tradeoffs.push("Historically low acceptance in prior tuning sessions.");

    const personalized = personalizeScore(score, card, input.userProfile);
    score = personalized.score;
    reasons.push(...personalized.reasons);

    if (card.tags.includes("finisher") && analytics.averageManaValue > 3.9) {
      score -= 8;
      tradeoffs.push("Another top-end card can strain curve consistency.");
    }

    const confidence = Math.max(0.1, Math.min(0.98, score / 100));
    return { cardId: card.id, score, reasons, confidence, tradeoffs };
  });

  return scored
    .filter((candidate) => candidate.score > 24)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
