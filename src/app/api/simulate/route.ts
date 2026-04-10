import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { simulateDeck } from "@/lib/simulation-engine";

const simulationSchema = z.object({
  entries: z.array(
    z.object({
      cardId: z.string().min(1),
      quantity: z.number().int().min(0).max(300)
    })
  ),
  iterations: z.number().int().min(100).max(5000).optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = simulationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid simulation payload", issues: parsed.error.issues }, { status: 400 });
  }

  const summary = simulateDeck(parsed.data.entries, parsed.data.iterations ?? 800);
  return NextResponse.json({ summary });
}
