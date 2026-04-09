export type Color = "W" | "U" | "B" | "R" | "G";

export type DeckFormat = "commander" | "constructed";

export interface CardFace {
  name: string;
  manaCost?: string;
  typeLine: string;
  oracleText?: string;
}

export interface CardLegality {
  commander: "legal" | "banned" | "not_legal";
  modern: "legal" | "banned" | "not_legal";
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
}
