import { describe, expect, it } from "vitest";
import { parseAverageDeckCardNames, scoreEdhrecAffinity, toEdhrecCommanderSlug } from "@/lib/edhrec-service";

describe("edhrec-service helpers", () => {
  it("normalizes commander names to EDHREC slugs", () => {
    expect(toEdhrecCommanderSlug("Mizzix of the Izmagnus")).toBe("mizzix-of-the-izmagnus");
    expect(toEdhrecCommanderSlug("Teferi's Protection")).toBe("teferis-protection");
  });

  it("parses card names from average decklist HTML", () => {
    const html = `
      <h3>Average Decklist</h3>
      <ul>
        <li>1 Sol Ring</li>
        <li>1 Arcane Signet</li>
        <li>1 Jeska's Will</li>
      </ul>
    `;
    expect(parseAverageDeckCardNames(html)).toEqual(["Sol Ring", "Arcane Signet", "Jeska's Will"]);
  });

  it("scores EDHREC affinity by rank", () => {
    const rankedNames = ["Sol Ring", "Arcane Signet", "Jeska's Will", "Terminate"];
    const result = scoreEdhrecAffinity(
      {
        id: "sol-ring",
        name: "Sol Ring",
        manaCost: "{1}",
        manaValue: 1,
        typeLine: "Artifact",
        colors: [],
        colorIdentity: [],
        legalities: { commander: "legal", modern: "not_legal", standard: "not_legal" },
        tags: ["ramp"]
      },
      rankedNames
    );

    expect(result.boost).toBeGreaterThan(0);
    expect(result.reason).toContain("EDHREC affinity");
  });
});
