import { CARDS } from "@/data/cards";
import { Card, Color } from "@/lib/types";

export interface CardSearchParams {
  name?: string;
  colors?: Color[];
  manaValueMin?: number;
  manaValueMax?: number;
  type?: string;
  text?: string;
  format?: "commander" | "modern" | "standard";
  commanderIdentity?: Color[];
}

const byId = new Map(CARDS.map((card) => [card.id, card]));

export const cardService = {
  listAll(): Card[] {
    return CARDS;
  },

  getById(id: string): Card | undefined {
    return byId.get(id);
  },

  search(params: CardSearchParams): Card[] {
    return CARDS.filter((card) => {
      if (params.name && !card.name.toLowerCase().includes(params.name.toLowerCase())) return false;

      if (params.colors?.length) {
        const passes = params.colors.every((color) => card.colors.includes(color));
        if (!passes) return false;
      }

      if (typeof params.manaValueMin === "number" && card.manaValue < params.manaValueMin) return false;
      if (typeof params.manaValueMax === "number" && card.manaValue > params.manaValueMax) return false;

      if (params.type && !card.typeLine.toLowerCase().includes(params.type.toLowerCase())) return false;
      if (params.text && !card.oracleText?.toLowerCase().includes(params.text.toLowerCase())) return false;

      if (params.format && card.legalities[params.format] !== "legal") return false;

      if (params.commanderIdentity?.length) {
        const identitySet = new Set(params.commanderIdentity);
        const valid = card.colorIdentity.every((color) => identitySet.has(color));
        if (!valid) return false;
      }

      return true;
    });
  }
};
