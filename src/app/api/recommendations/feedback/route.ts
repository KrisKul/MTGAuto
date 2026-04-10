import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerRecommendationFeedback } from "@/lib/ranker";

const feedbackSchema = z.object({
  cardId: z.string().min(1),
  accepted: z.boolean()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback payload", issues: parsed.error.issues }, { status: 400 });
  }

  registerRecommendationFeedback(parsed.data.cardId, parsed.data.accepted);
  return NextResponse.json({ ok: true });
}
