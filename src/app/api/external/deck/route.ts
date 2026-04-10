import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchDeckCheckDeck } from "@/lib/deckcheck-service";

const querySchema = z
  .object({
    deck_id: z.string().min(1).optional(),
    deck_url: z.string().url().optional()
  })
  .refine((value) => value.deck_id || value.deck_url, {
    message: "Provide deck_id or deck_url"
  });

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    deck_id: url.searchParams.get("deck_id") ?? undefined,
    deck_url: url.searchParams.get("deck_url") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  try {
    const data = await fetchDeckCheckDeck({ deckId: parsed.data.deck_id, deckUrl: parsed.data.deck_url });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DeckCheck proxy error" },
      { status: 502 }
    );
  }
}
