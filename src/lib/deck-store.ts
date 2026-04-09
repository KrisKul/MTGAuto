import { prisma } from "@/lib/prisma";
import { DeckEntry, DeckModel, DeckFormat } from "@/lib/types";

function parseEntries(json: string): DeckEntry[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapDeck(deck: {
  id: string;
  name: string;
  format: string;
  commanderId: string | null;
  constructedFormat: string;
  minDeckSize: number;
  sideboardLimit: number;
  entriesJson: string;
  sideboardJson: string;
  createdAt: Date;
  updatedAt: Date;
}): DeckModel {
  return {
    id: deck.id,
    name: deck.name,
    format: deck.format as DeckFormat,
    commanderId: deck.commanderId,
    constructedFormat: deck.constructedFormat as DeckModel["constructedFormat"],
    minDeckSize: deck.minDeckSize,
    sideboardLimit: deck.sideboardLimit,
    entries: parseEntries(deck.entriesJson),
    sideboard: parseEntries(deck.sideboardJson),
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString()
  };
}

export const deckStore = {
  async list(): Promise<DeckModel[]> {
    const decks = await prisma.deck.findMany({ orderBy: { updatedAt: "desc" } });
    return decks.map(mapDeck);
  },

  async get(id: string): Promise<DeckModel | null> {
    const deck = await prisma.deck.findUnique({ where: { id } });
    return deck ? mapDeck(deck) : null;
  },

  async create(payload: Omit<DeckModel, "id" | "createdAt" | "updatedAt">): Promise<DeckModel> {
    const deck = await prisma.deck.create({
      data: {
        name: payload.name,
        format: payload.format,
        commanderId: payload.commanderId,
        constructedFormat: payload.constructedFormat,
        minDeckSize: payload.minDeckSize,
        sideboardLimit: payload.sideboardLimit,
        entriesJson: JSON.stringify(payload.entries),
        sideboardJson: JSON.stringify(payload.sideboard)
      }
    });

    return mapDeck(deck);
  },

  async update(id: string, payload: Omit<DeckModel, "id" | "createdAt" | "updatedAt">): Promise<DeckModel> {
    const deck = await prisma.deck.update({
      where: { id },
      data: {
        name: payload.name,
        format: payload.format,
        commanderId: payload.commanderId,
        constructedFormat: payload.constructedFormat,
        minDeckSize: payload.minDeckSize,
        sideboardLimit: payload.sideboardLimit,
        entriesJson: JSON.stringify(payload.entries),
        sideboardJson: JSON.stringify(payload.sideboard)
      }
    });

    return mapDeck(deck);
  },

  async remove(id: string): Promise<void> {
    await prisma.deck.delete({ where: { id } });
  },

  async duplicate(id: string): Promise<DeckModel | null> {
    const original = await prisma.deck.findUnique({ where: { id } });
    if (!original) return null;

    const deck = await prisma.deck.create({
      data: {
        name: `${original.name} (Copy)`,
        format: original.format,
        commanderId: original.commanderId,
        constructedFormat: original.constructedFormat,
        minDeckSize: original.minDeckSize,
        sideboardLimit: original.sideboardLimit,
        entriesJson: original.entriesJson,
        sideboardJson: original.sideboardJson
      }
    });

    return mapDeck(deck);
  }
};
