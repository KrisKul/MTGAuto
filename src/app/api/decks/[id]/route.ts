import { NextRequest, NextResponse } from "next/server";
import { deckStore } from "@/lib/deck-store";
import { deckPayloadSchema } from "@/lib/api-schemas";

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
  const body = await request.json();
  const parsed = deckPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deck payload", issues: parsed.error.issues }, { status: 400 });
  }

  const deck = await deckStore.update(id, parsed.data);
  return NextResponse.json({ deck });
}

export async function DELETE(_: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  await deckStore.remove(id);
  return new NextResponse(null, { status: 204 });
}
