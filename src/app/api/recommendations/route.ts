import { NextRequest, NextResponse } from "next/server";
import { recommendCards } from "@/lib/recommendations";
import { recommendationsPayloadSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = recommendationsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recommendation payload", issues: parsed.error.issues }, { status: 400 });
  }

  const recommendations = recommendCards(parsed.data);
  return NextResponse.json({ recommendations });
}
