import { NextRequest, NextResponse } from "next/server";
import { deckStore } from "@/lib/deck-store";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const deck = await deckStore.duplicate(id);
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  return NextResponse.json({ deck }, { status: 201 });
}
