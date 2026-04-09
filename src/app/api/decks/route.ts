import { NextRequest, NextResponse } from "next/server";
import { deckStore } from "@/lib/deck-store";

export async function GET() {
  const decks = await deckStore.list();
  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const deck = await deckStore.create(payload);
  return NextResponse.json({ deck }, { status: 201 });
}
