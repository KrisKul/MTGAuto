import { NextRequest, NextResponse } from "next/server";
import { recommendCards } from "@/lib/recommendations";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const recommendations = recommendCards(payload);
  return NextResponse.json({ recommendations });
}
