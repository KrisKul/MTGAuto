export type Color = "W" | "U" | "B" | "R" | "G";

export type DeckFormat = "commander" | "constructed";
export type ConstructedFormat = "modern" | "pioneer" | "standard";

export interface CardFace {
  name: string;
  manaCost?: string;
  typeLine: string;
  oracleText?: string;
}

export interface CardLegality {
  commander: "legal" | "banned" | "not_legal";
  modern: "legal" | "banned" | "not_legal";
  pioneer?: "legal" | "banned" | "not_legal";
  standard: "legal" | "banned" | "not_legal";
}

export interface Card {
  id: string;
  name: string;
  manaCost?: string;
  manaValue: number;
  typeLine: string;
  oracleText?: string;
  colors: Color[];
  colorIdentity: Color[];
  legalities: CardLegality;
  imageUri?: string;
  cardFaces?: CardFace[];
  isBasicLand?: boolean;
  canBeCommander?: boolean;
  tags: string[];
}

export interface DeckEntry {
  cardId: string;
  quantity: number;
}

export interface DeckModel {
  id: string;
  name: string;
  format: DeckFormat;
  constructedFormat: ConstructedFormat;
  commanderId?: string | null;
  minDeckSize: number;
  sideboardLimit: number;
  sideboard: DeckEntry[];
  entries: DeckEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DeckValidationIssue {
  severity: "error" | "warning";
  message: string;
}

export interface DeckAnalytics {
  cardCount: number;
  averageManaValue: number;
  manaCurve: Record<string, number>;
  colorDistribution: Record<Color, number>;
  typeBreakdown: Record<string, number>;
}

export interface Recommendation {
  cardId: string;
  score: number;
  reasons: string[];
  confidence: number;
  tradeoffs: string[];
}

export type RecommendationObjective = "balanced" | "consistency" | "vs_aggro" | "budget";

export type PlayerStyle = "tempo" | "midrange" | "control" | "combo" | "stax";

export interface UserProfile {
  userId?: string;
  preferredStyles: PlayerStyle[];
  budgetCapUsd?: number;
  riskTolerance: "low" | "medium" | "high";
  favoriteColors?: Color[];
}

export interface MatchupRecord {
  archetype: string;
  sampleSize: number;
  winRate: number;
}

export interface MetagameSnapshot {
  format: "commander" | "modern" | "pioneer" | "standard";
  generatedAt: string;
  matchups: MatchupRecord[];
}

export interface SimulationSummary {
  openingHandKeepRate: number;
  turn2InteractionRate: number;
  turn4ActionRate: number;
  manaScrewRate: number;
  manaFloodRate: number;
}

export interface CommanderCompositionTarget {
  lands: { min: number; max: number; target: number };
  ramp: number;
  draw: number;
  interaction: number;
  boardWipes: number;
  finishers: number;
}
