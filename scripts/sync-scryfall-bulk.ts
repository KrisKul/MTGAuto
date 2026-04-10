import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface ScryfallBulkFile {
  type: string;
  download_uri: string;
  updated_at: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json() as Promise<T>;
}

async function run() {
  const payload = await fetchJson<{ data: ScryfallBulkFile[] }>("https://api.scryfall.com/bulk-data");
  const oracleCards = payload.data.find((file) => file.type === "oracle_cards");
  if (!oracleCards) throw new Error("Could not find oracle_cards bulk file.");

  const bulkResponse = await fetch(oracleCards.download_uri);
  if (!bulkResponse.ok) throw new Error(`Failed to download oracle bulk file (${bulkResponse.status}).`);
  const text = await bulkResponse.text();
  const cards = JSON.parse(text) as Array<Record<string, unknown>>;

  const outDir = join(process.cwd(), "data", "ingestion");
  await mkdir(outDir, { recursive: true });
  const output = {
    source: "scryfall-oracle-bulk",
    downloadedAt: new Date().toISOString(),
    sourceUpdatedAt: oracleCards.updated_at,
    totalCards: cards.length,
    cards
  };

  await writeFile(join(outDir, "scryfall-oracle-cards.json"), JSON.stringify(output));
  console.log(`Synced ${cards.length} cards to data/ingestion/scryfall-oracle-cards.json`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
