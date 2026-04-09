import { z } from "zod";

export const deckEntrySchema = z.object({
  cardId: z.string().min(1),
  quantity: z.number().int().min(0).max(200)
});

export const deckPayloadSchema = z.object({
  name: z.string().min(1).max(120),
  format: z.enum(["commander", "constructed"]),
  constructedFormat: z.enum(["modern", "pioneer", "standard"]).default("modern"),
  commanderId: z.string().min(1).nullable().optional(),
  minDeckSize: z.number().int().min(40).max(250),
  sideboardLimit: z.number().int().min(0).max(30),
  entries: z.array(deckEntrySchema).max(300),
  sideboard: z.array(deckEntrySchema).max(30)
});

export const recommendationsPayloadSchema = z.object({
  format: z.enum(["commander", "constructed"]),
  constructedFormat: z.enum(["modern", "pioneer", "standard"]).default("modern"),
  commanderId: z.string().nullable().optional(),
  entries: z.array(deckEntrySchema)
});
