import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.deck.upsert({
    where: { id: "seed-ur-spells" },
    update: {},
    create: {
      id: "seed-ur-spells",
      name: "Mizzix UR Spells (Seed)",
      format: "commander",
      commanderId: "mizzix",
      minDeckSize: 100,
      sideboardLimit: 0,
      entriesJson: JSON.stringify([
        { cardId: "island", quantity: 35 },
        { cardId: "mountain", quantity: 35 },
        { cardId: "counterspell", quantity: 1 },
        { cardId: "sol-ring", quantity: 1 },
        { cardId: "arcane-signet", quantity: 1 },
        { cardId: "ponder", quantity: 1 },
        { cardId: "preordain", quantity: 1 },
        { cardId: "brainstorm", quantity: 1 },
        { cardId: "swan-song", quantity: 1 },
        { cardId: "cyclonic-rift", quantity: 1 },
        { cardId: "blasphemous-act", quantity: 1 },
        { cardId: "niv-mizzet-parun", quantity: 1 }
      ]),
      sideboardJson: JSON.stringify([])
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
