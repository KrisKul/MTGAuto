# Commander deckbuilding heuristics used in this app

This project now applies a practical Commander template influenced by commonly used EDH deckbuilding baselines:

- 100-card singleton constraints and color identity limits.
- Typical baseline ranges around:
  - ~36-38 lands
  - ~10 ramp pieces
  - ~10 draw/value pieces
  - ~10 interaction/removal pieces
  - ~2-4 board wipes
- Land targets should move up when average mana value is high and ramp is low.
- Keepable opening hands are approximated as hands with 2-4 lands in the opening 7.
- EDHREC average-deck pages are parsed opportunistically to add community-affinity weighting for commander-specific card choices.

Implementation references:
- `src/lib/commander-composition.ts`
- `src/lib/recommendations.ts`
- `src/lib/deck-validation.ts`
