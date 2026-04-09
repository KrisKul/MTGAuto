import { cardService } from "@/lib/card-service";
import { ConstructedFormat, DeckEntry, DeckFormat, DeckValidationIssue, Color } from "@/lib/types";

interface DeckValidationInput {
  format: DeckFormat;
  constructedFormat?: ConstructedFormat;
  entries: DeckEntry[];
  commanderId?: string | null;
  minDeckSize?: number;
  sideboard?: DeckEntry[];
  sideboardLimit?: number;
}

function total(entries: DeckEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.quantity, 0);
}

function canBeCommander(typeLine: string, oracleText?: string, explicitFlag?: boolean): boolean {
  if (explicitFlag) return true;
  if (typeLine.includes("Legendary") && typeLine.includes("Creature")) return true;
  return (oracleText ?? "").toLowerCase().includes("can be your commander");
}

export function validateDeck(input: DeckValidationInput): DeckValidationIssue[] {
  const issues: DeckValidationIssue[] = [];
  const mainDeckSize = total(input.entries);
  const sideboardSize = total(input.sideboard ?? []);
  const constructedFormat = input.constructedFormat ?? "modern";

  for (const entry of input.entries) {
    const card = cardService.getById(entry.cardId);
    if (!card) {
      issues.push({ severity: "error", message: `Unknown card id: ${entry.cardId}` });
      continue;
    }

    const legalityFormat = input.format === "constructed" ? constructedFormat : "commander";
    const legality = card.legalities[legalityFormat] ?? "not_legal";
    if (legality !== "legal") {
      issues.push({ severity: "error", message: `${card.name} is not legal in ${legalityFormat}.` });
    }
  }

  if (input.format === "commander") {
    if (!input.commanderId) {
      issues.push({ severity: "error", message: "Commander format requires exactly one commander." });
      return issues;
    }

    const commander = cardService.getById(input.commanderId);
    if (!commander) {
      issues.push({ severity: "error", message: "Commander card could not be found." });
      return issues;
    }

    if (!canBeCommander(commander.typeLine, commander.oracleText, commander.canBeCommander)) {
      issues.push({ severity: "error", message: "Selected commander is not commander-legal." });
    }

    const commanderCopiesInDeck = input.entries.find((entry) => entry.cardId === input.commanderId)?.quantity ?? 0;
    if (commanderCopiesInDeck > 0) {
      issues.push({ severity: "error", message: "Commander should not be added to the main deck list." });
    }

    const identity = new Set<Color>(commander.colorIdentity);
    const cardCounts = new Map<string, number>();
    for (const entry of input.entries) {
      const card = cardService.getById(entry.cardId);
      if (!card) continue;
      cardCounts.set(card.id, (cardCounts.get(card.id) ?? 0) + entry.quantity);

      const offColor = card.colorIdentity.filter((color) => !identity.has(color));
      if (offColor.length) {
        issues.push({
          severity: "error",
          message: `${card.name} violates commander's color identity (${offColor.join(",")}).`
        });
      }
    }

    for (const [cardId, count] of cardCounts) {
      const card = cardService.getById(cardId);
      if (!card) continue;
      if (count > 1 && !card.isBasicLand) {
        issues.push({ severity: "error", message: `${card.name} violates commander singleton rules.` });
      }
    }

    const totalWithCommander = mainDeckSize + 1;
    if (totalWithCommander !== 100) {
      issues.push({
        severity: "error",
        message: `Commander deck must have 99 main-deck cards plus commander (currently ${mainDeckSize} + commander).`
      });
    }
  }

  if (input.format === "constructed") {
    const minDeckSize = input.minDeckSize ?? 60;
    if (mainDeckSize < minDeckSize) {
      issues.push({ severity: "error", message: `Constructed deck must contain at least ${minDeckSize} cards.` });
    }

    const counts = new Map<string, number>();
    for (const entry of input.entries) {
      const card = cardService.getById(entry.cardId);
      if (!card) continue;
      counts.set(card.id, (counts.get(card.id) ?? 0) + entry.quantity);
    }

    for (const [cardId, count] of counts) {
      const card = cardService.getById(cardId);
      if (card && count > 4 && !card.isBasicLand) {
        issues.push({ severity: "error", message: `${card.name} exceeds 4-copy limit.` });
      }
    }
  }

  if (sideboardSize > (input.sideboardLimit ?? 15)) {
    issues.push({ severity: "error", message: "Sideboard exceeds limit." });
  }

  if (
    !input.entries.some((entry) => {
      const card = cardService.getById(entry.cardId);
      return card?.typeLine.includes("Land");
    })
  ) {
    issues.push({ severity: "warning", message: "Deck has no lands. Add mana sources for consistency." });
  }

  return issues;
}
