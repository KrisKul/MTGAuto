import { cardService } from "@/lib/card-service";
import { DeckEntry, SimulationSummary } from "@/lib/types";

interface ExpandedCard {
  cardId: string;
  manaValue: number;
  isLand: boolean;
  tags: string[];
}

function expandDeck(entries: DeckEntry[]): ExpandedCard[] {
  const expanded: ExpandedCard[] = [];
  for (const entry of entries) {
    const card = cardService.getById(entry.cardId);
    if (!card) continue;
    for (let i = 0; i < entry.quantity; i += 1) {
      expanded.push({
        cardId: entry.cardId,
        manaValue: card.manaValue,
        isLand: card.typeLine.includes("Land"),
        tags: card.tags
      });
    }
  }
  return expanded;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function simulateDeck(entries: DeckEntry[], iterations = 600): SimulationSummary {
  const deck = expandDeck(entries);
  if (deck.length === 0) {
    return {
      openingHandKeepRate: 0,
      turn2InteractionRate: 0,
      turn4ActionRate: 0,
      manaScrewRate: 1,
      manaFloodRate: 0
    };
  }

  let keepHands = 0;
  let turn2Interaction = 0;
  let turn4Action = 0;
  let manaScrew = 0;
  let manaFlood = 0;

  for (let i = 0; i < iterations; i += 1) {
    const shuffled = shuffle(deck);
    const hand = shuffled.slice(0, 7);
    const draws = shuffled.slice(7, 11);
    const firstTen = [...hand, ...draws];
    const landsInHand = hand.filter((card) => card.isLand).length;
    const landsByTurn4 = firstTen.filter((card) => card.isLand).length;
    const hasTurn2Interaction = firstTen.some((card) => card.manaValue <= 2 && (card.tags.includes("interaction") || card.tags.includes("removal")));
    const hasTurn4Action = firstTen.some((card) => card.manaValue <= 4 && !card.isLand);

    if (landsInHand >= 2 && landsInHand <= 4) keepHands += 1;
    if (hasTurn2Interaction) turn2Interaction += 1;
    if (hasTurn4Action) turn4Action += 1;
    if (landsByTurn4 < 3) manaScrew += 1;
    if (landsByTurn4 > 6) manaFlood += 1;
  }

  return {
    openingHandKeepRate: keepHands / iterations,
    turn2InteractionRate: turn2Interaction / iterations,
    turn4ActionRate: turn4Action / iterations,
    manaScrewRate: manaScrew / iterations,
    manaFloodRate: manaFlood / iterations
  };
}
