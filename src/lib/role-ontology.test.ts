import { describe, expect, it } from "vitest";
import { inferCardRoles } from "@/lib/role-ontology";

describe("role ontology", () => {
  it("infers removal and interaction from oracle text", () => {
    const roles = inferCardRoles({
      id: "test",
      name: "Test Bolt",
      manaCost: "{R}",
      manaValue: 1,
      typeLine: "Instant",
      oracleText: "Deals 3 damage to target creature.",
      colors: ["R"],
      colorIdentity: ["R"],
      legalities: { commander: "legal", modern: "legal", standard: "not_legal" },
      tags: []
    });

    expect(roles).toContain("removal");
    expect(roles).toContain("interaction");
  });
});
