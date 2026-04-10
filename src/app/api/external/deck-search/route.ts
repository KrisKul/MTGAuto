import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchDeckCheckSearch } from "@/lib/deckcheck-service";

const querySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(24),
  min_pi: z.coerce.number().min(0).max(10).optional(),
  max_pi: z.coerce.number().min(0).max(10).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  colors: z.string().optional(),
  color_match: z.enum(["exactly", "at-least", "at-most", "not-these"]).optional(),
  brackets: z.string().optional(),
  hide_outdated: z.enum(["true", "false"]).optional(),
  sort: z.enum(["power", "recent", "price", "efficiency"]).optional()
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  try {
    const data = await fetchDeckCheckSearch(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DeckCheck proxy error" },
      { status: 502 }
    );
  }
}
