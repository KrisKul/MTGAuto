# MTGAuto Deck Builder MVP

Production-minded MVP for building and tuning Magic: The Gathering decks with real-time validation, analytics, and transparent recommendations.

## Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma
- **Tests**: Vitest for core domain logic

## Features

- Card browser with filters for:
  - name
  - color
  - mana value range
  - type line
  - oracle text
  - format legality (Commander / Modern / Pioneer / Standard)
  - commander color identity compatibility
- Deck editor with quantity controls
- Supports:
  - Commander (100 cards, singleton rules, color identity checks)
  - 60-card constructed (configurable minimum deck size, 4-of rule, sideboard limits)
- Live analytics:
  - card count
  - mana curve
  - color distribution
  - type breakdown
  - average mana value
- Validation panel with errors and warnings
- Save/edit/duplicate decks (SQLite persistence)
- Import/export deck JSON
- Recommendation panel driven by modular heuristics:
  - color identity compatibility
  - mana curve smoothing
  - role coverage targets (ramp, draw, interaction/removal, board wipes, lands, finishers)
  - opening-hand consistency scoring (2–4 land opener probability)
  - optional EDHREC average-deck affinity boost (when commander page data is reachable)
  - recommendation ranking feedback loop via `/api/recommendations/feedback`
  - objective mode (`balanced`, `more consistent`, `beat aggro`, `budget-friendly`)
  - recommendation confidence + tradeoff explanations
  - card-type and consistency hints
- Simulation API for deck consistency testing (`/api/simulate`) with keep rate / screw / flood / early-action signals.
- Handles double-faced/modal cards by exposing card face metadata in card records.

## Data source approach

Card access is isolated in `src/lib/card-service.ts`, currently backed by curated card metadata in `src/data/cards.ts` derived from reliable Scryfall card fields (name, mana value, type line, oracle text, legalities, color identity, image URI shape). This makes it easy to later swap the service to Scryfall API/bulk ingestion without changing UI or core logic.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Generate Prisma client + create DB schema

```bash
npm run prisma:generate
npm run db:push
```

4. Seed sample deck data

```bash
npm run prisma:seed
```

This currently seeds at least two Commander examples, including a **The Infamous Cruelclaw** Rakdos list tuned away from extreme land-only composition.

5. Start app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Test and quality commands

```bash
npm run test
npm run lint
npm run build
npm run ingest:scryfall
```


### DeckCheck-compatible external proxy endpoints

To align functionally with `https://deckcheck.co/api/external`, this app now exposes proxy routes:

- `GET /api/external/deck?deck_id=...` or `GET /api/external/deck?deck_url=...`
- `GET /api/external/deck-search?...`

Set these env vars (optional, but recommended):

- `DECKCHECK_API_BASE` (defaults to `https://deckcheck.co/api/external`)
- `DECKCHECK_API_KEY` (if your upstream setup requires one)

These endpoints provide a stable integration boundary so the UI/services can consume DeckCheck-style external data without coupling directly to third-party endpoint details.

## Architecture

- `src/app/page.tsx` — main deck builder page
- `src/components/deck-builder.tsx` — client UI with panels and user flows
- `src/app/api/cards/route.ts` — card search/browse API
- `src/app/api/decks/**` — CRUD + duplicate APIs for decks
- `src/app/api/recommendations/route.ts` — recommendation endpoint
- `src/app/api/recommendations/feedback/route.ts` — recommendation acceptance/reject feedback
- `src/app/api/simulate/route.ts` — Monte Carlo simulation endpoint
- `src/app/api/external/**` — DeckCheck-compatible external proxy endpoints
- `src/lib/api-schemas.ts` — server-side request validation schemas
- `src/lib/card-service.ts` — card data access service layer
- `src/lib/edhrec-service.ts` — EDHREC average-deck enrichment + parsing helpers
- `src/lib/deckcheck-service.ts` — DeckCheck external API proxy service
- `src/lib/deck-validation.ts` — deck rule validation logic
- `src/lib/deck-analytics.ts` — mana curve/stat calculations
- `src/lib/recommendations.ts` — transparent heuristic recommender
- `src/lib/role-ontology.ts` — semantic role inference from card text/type
- `src/lib/simulation-engine.ts` — Monte Carlo deck simulation module
- `src/lib/metagame-engine.ts` — matchup pressure scoring helpers
- `src/lib/personalization.ts` — user profile weighting helpers
- `src/lib/ranker.ts` — in-memory feedback-based rank adjustment
- `src/lib/deck-store.ts` — Prisma persistence adapter
- `prisma/schema.prisma` — DB schema
- `prisma/seed.ts` — seed data
- `src/lib/*.test.ts` — tests for validation, analytics, recommendations

## Import / export format

Deck import/export is JSON with this shape:

```json
{
  "name": "Deck name",
  "format": "commander",
  "commanderId": "mizzix",
  "minDeckSize": 99,
  "sideboardLimit": 0,
  "entries": [{ "cardId": "island", "quantity": 30 }],
  "sideboard": []
}
```

## MVP limitations / assumptions

- Uses a hybrid search model: local curated cards plus Scryfall API search for broader discovery when network is available.
- Commander card pool now includes additional Rakdos/colorless staples so recommendations and seed builds are less land-skewed.
- Constructed decks now support a selectable legality target (Modern/Pioneer/Standard), but advanced format-specific banlist nuances are still simplified to card legality fields.
- Recommendation heuristics are intentionally transparent and rule-based (no ML ranking yet).
- Commander partners/backgrounds/special-rule exceptions are not yet modeled.


## AI system design roadmap

A detailed high-level design and 90-day execution plan for evolving this MVP into an exceptional AI deck builder is documented in:

- `docs/ai-system-design.md`

## Next improvements

- Add Scryfall bulk import + scheduled sync
- Add auth/user ownership
- Add richer deck tags and playtest hand simulator
- Add chart visualizations for curve/colors
- Add advanced format support (Pioneer, Pauper, etc.)
