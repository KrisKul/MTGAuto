# Exceptional AI Deck Builder System Design

This document captures the target architecture and product plan for evolving the current MVP into a best-in-class AI deck-building platform.

## 1) What we have now (good foundation)

The current app already has the right seams to scale:

- Clear service boundaries:
  - `card-service`
  - `deck-validation`
  - `deck-analytics`
  - `recommendations`
- API routes separated from client UI.
- Deterministic validation/recommendation logic (excellent baseline for eval and guardrails).
- Prisma persistence (JSON-in-row for MVP speed).

This is the right starting point for an incremental AI architecture.

---

## 2) What makes an “exceptional AI deck builder”

### A. Real data backbone (non-negotiable)

To move beyond MVP quality, the system needs continuously refreshed data:

- Full card corpus
- Card prices
- Metagame snapshots
- Tournament results
- Archetype labels

#### Add
- Card ingest pipeline (Scryfall bulk + periodic diff sync)
- Metagame ingest (MTGO / MTGTop8 / 17Lands-like sources by format)
- Versioned legality snapshots by date (historically reproducible recommendations)

Local curated cards + optional live search are useful for prototyping, but insufficient for high-end tuning.

### B. Normalized domain model + feature store

Move beyond JSON blobs in a single `Deck` row for scalable analytics/ML.

#### Add normalized tables
- `deck`
- `deck_card`
- `deck_version`
- `match_result`
- `event_meta`
- `archetype`
- `card_embedding`

Also expand per-card role/features from simple tags to a multi-label taxonomy.

### C. Hybrid recommendation engine (3-layer)

Current heuristics are a strong baseline. Next step is a hybrid stack:

1. **Constraint layer** (hard rules)
   - legality
   - color identity
   - curve constraints
   - deck-size constraints
2. **Retrieval layer**
   - nearest cards/archetypes via embeddings
   - co-occurrence graph retrieval
3. **Ranking layer**
   - learned ranker (LambdaMART / XGBoost / transformer reranker)
   - objective targets: winrate, consistency, matchup coverage, mana stability

#### Recommendation output contract
Every recommendation should include:
- Recommendation
- Why
- Confidence
- Tradeoffs (e.g., better vs aggro, weaker vs control)

### D. Simulation engine (major differentiator)

Top-tier deck builders simulate, not just score heuristics.

#### Add Monte Carlo simulation for
- Opening hand keep/mull rates
- Mana screw/flood probabilities by turn
- Curve hit rates (e.g., turn-2 interaction, turn-4 sweeper)
- Goldfish clocks and threat density

This enables measurable statements such as:
> “Adding X improves turn-2 interaction hit rate by 8%.”

### E. Context-aware copilots

Ship multiple focused copilots with explicit objective functions:

- Brewing copilot (from commander/theme)
- Tuning copilot (improve matchup spread)
- Budget copilot (price-constrained substitutions)
- Sideboard copilot (meta-targeted plans)

### F. Evaluation + guardrails

#### Offline eval
- recommendation precision@k
- legality violation rate (target ≈ 0)
- consistency improvement metrics from simulation

#### Online eval
- recommendation acceptance rate
- revert rate
- user deck performance over time

Deterministic validator remains final safety gate before presenting/applying AI changes.

---

## 3) Product features that feel exceptional

- One-click **Fix My Deck** with selectable objectives:
  - more consistent
  - beat aggro
  - budget under $200
- What-if diffs:
  - replace N cards and show curve/color/probability deltas
- Matchup panel:
  - strengths/weaknesses by archetype
- Explainable recommendations:
  - measurable improvement statements with confidence
- Deck evolution timeline:
  - version history with per-change performance impact

---

## 4) Suggested practical system architecture

### Core services
- `ingest-service` (cards, prices, events, archetypes)
- `feature-service` (deck/card features, embeddings, graph)
- `reco-service` (retrieve + rank + explain)
- `sim-service` (Monte Carlo)
- `api-gateway` (auth, rate-limit, orchestration)
- `web-app` (Next.js)

### Storage
- Postgres (normalized OLTP + metadata)
- Redis (low-latency cache)
- Object storage (snapshots/training sets)
- Vector store (embeddings + semantic retrieval)

### ML stack
- Feature pipelines (batch + near-real-time)
- Nightly training jobs
- Model registry + canary deploys

---

## 5) 90-day roadmap (execution plan)

### Phase 1 (Weeks 1–3): Data + schema hardening
- Normalize deck schema
- Add deck versions and per-card rows
- Add full-card ingest jobs + legality snapshots

### Phase 2 (Weeks 4–6): Simulation + advanced heuristics
- Implement simulation service
- Add objective-driven recommendation scoring
- Add explainability and confidence outputs

### Phase 3 (Weeks 7–10): Retrieval/ranking AI
- Build embedding + co-occurrence retrieval
- Train first learned ranker
- Add offline eval suite and baseline gates

### Phase 4 (Weeks 11–13): Product polish + online eval
- Ship context-aware copilots
- Add matchup panel + what-if diffs + deck timeline
- Run A/B tests and tune acceptance/revert metrics
