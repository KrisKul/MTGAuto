import { Card } from "@/lib/types";

const ROLE_PATTERNS: Array<{ role: string; checks: Array<(card: Card) => boolean> }> = [
  {
    role: "ramp",
    checks: [
      (card) => /add \{[wubrgc]\}/i.test(card.oracleText ?? ""),
      (card) => /search your library for (a|up to two) basic land/i.test(card.oracleText ?? "")
    ]
  },
  {
    role: "draw",
    checks: [
      (card) => /\bdraw (a|two|three|x) card/i.test(card.oracleText ?? ""),
      (card) => /whenever .* draw/i.test(card.oracleText ?? "")
    ]
  },
  {
    role: "removal",
    checks: [(card) => /\b(destroy|exile|counter target|deals \d+ damage)\b/i.test(card.oracleText ?? "")]
  },
  {
    role: "interaction",
    checks: [(card) => /\b(counter target|target spell|target permanent|target creature)\b/i.test(card.oracleText ?? "")]
  },
  {
    role: "boardwipe",
    checks: [(card) => /\bdestroy all|each creature|all creatures\b/i.test(card.oracleText ?? "")]
  },
  {
    role: "finisher",
    checks: [(card) => card.manaValue >= 6 || /\bdouble strike|extra combat|wins? the game\b/i.test(card.oracleText ?? "")]
  }
];

export function inferCardRoles(card: Card): string[] {
  const inferred = new Set(card.tags);
  if (card.typeLine.includes("Land")) inferred.add("land");
  for (const pattern of ROLE_PATTERNS) {
    if (pattern.checks.some((check) => check(card))) inferred.add(pattern.role);
  }
  return [...inferred];
}
