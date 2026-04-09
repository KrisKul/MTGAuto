import { NextRequest, NextResponse } from "next/server";
import { deckStore } from "@/lib/deck-store";
import { deckPayloadSchema } from "@/lib/api-schemas";

export async function GET() {
  const decks = await deckStore.list();
  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = deckPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deck payload", issues: parsed.error.issues }, { status: 400 });
  }

  const deck = await deckStore.create(parsed.data);
  return NextResponse.json({ deck }, { status: 201 });
}
