import { NextRequest, NextResponse } from "next/server";
import { deckStore } from "@/lib/deck-store";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const deck = await deckStore.get(id);
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  return NextResponse.json({ deck });
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const payload = await request.json();
  const deck = await deckStore.update(id, payload);
  return NextResponse.json({ deck });
}

export async function DELETE(_: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  await deckStore.remove(id);
  return new NextResponse(null, { status: 204 });
}
