import { NextRequest, NextResponse } from "next/server";
import { cardService } from "@/lib/card-service";
import { Color } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const colors = searchParams.get("colors")?.split(",").filter(Boolean) as Color[] | undefined;
  const commanderIdentity = searchParams
    .get("commanderIdentity")
    ?.split(",")
    .filter(Boolean) as Color[] | undefined;

  const cards = await cardService.search({
    name: searchParams.get("name") ?? undefined,
    colors,
    manaValueMin: searchParams.get("mvMin") ? Number(searchParams.get("mvMin")) : undefined,
    manaValueMax: searchParams.get("mvMax") ? Number(searchParams.get("mvMax")) : undefined,
    type: searchParams.get("type") ?? undefined,
    text: searchParams.get("text") ?? undefined,
    format: (searchParams.get("format") as "commander" | "modern" | "pioneer" | "standard" | null) ?? undefined,
    commanderIdentity,
    includeExternal: searchParams.get("external") !== "false"
  });

  return NextResponse.json({ cards });
}
