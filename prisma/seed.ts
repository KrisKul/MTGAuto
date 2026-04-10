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
      constructedFormat: "modern",
      minDeckSize: 99,
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

  await prisma.deck.upsert({
    where: { id: "seed-cruelclaw-br-midrange" },
    update: {},
    create: {
      id: "seed-cruelclaw-br-midrange",
      name: "The Infamous Cruelclaw BR Midrange (Seed)",
      format: "commander",
      commanderId: "infamous-cruelclaw",
      constructedFormat: "modern",
      minDeckSize: 99,
      sideboardLimit: 0,
      entriesJson: JSON.stringify([
        { cardId: "mountain", quantity: 33 },
        { cardId: "swamp", quantity: 30 },
        { cardId: "sol-ring", quantity: 1 },
        { cardId: "arcane-signet", quantity: 1 },
        { cardId: "commanders-sphere", quantity: 1 },
        { cardId: "lightning-greaves", quantity: 1 },
        { cardId: "commanders-plate", quantity: 1 },
        { cardId: "rakdos-signet", quantity: 1 },
        { cardId: "talisman-of-indulgence", quantity: 1 },
        { cardId: "wayfarers-bauble", quantity: 1 },
        { cardId: "swiftfoot-boots", quantity: 1 },
        { cardId: "skullclamp", quantity: 1 },
        { cardId: "vandalblast", quantity: 1 },
        { cardId: "terminate", quantity: 1 },
        { cardId: "feed-the-swarm", quantity: 1 },
        { cardId: "bedevil", quantity: 1 },
        { cardId: "chaos-warp", quantity: 1 },
        { cardId: "abrade", quantity: 1 },
        { cardId: "blasphemous-act", quantity: 1 },
        { cardId: "read-the-bones", quantity: 1 },
        { cardId: "sign-in-blood", quantity: 1 },
        { cardId: "nights-whisper", quantity: 1 },
        { cardId: "phyrexian-arena", quantity: 1 },
        { cardId: "big-score", quantity: 1 },
        { cardId: "jeskas-will", quantity: 1 },
        { cardId: "fable-mirror-breaker", quantity: 1 },
        { cardId: "dockside-extortionist", quantity: 1 },
        { cardId: "blood-artist", quantity: 1 },
        { cardId: "reanimate", quantity: 1 },
        { cardId: "animate-dead", quantity: 1 },
        { cardId: "malakir-rebirth", quantity: 1 },
        { cardId: "ancient-tomb", quantity: 1 },
        { cardId: "command-beacon", quantity: 1 },
        { cardId: "blood-crypt", quantity: 1 },
        { cardId: "dragonskull-summit", quantity: 1 },
        { cardId: "haunted-ridge", quantity: 1 },
        { cardId: "smoldering-marsh", quantity: 1 },
        { cardId: "tevesh-szat", quantity: 1 }
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
