# Issue #11 — Grammar & Chunk Inventories + real GrammarMatcher/ChunkMatcher (canonical form)

Proof of work for a backend / non-visual slice: the passing test run plus a real
`createLesson`-path output through the **real** matchers (not the #3 fakes), showing
a Grammar Point resolving to a stable Inventory ID and a canonicalized + tiered Chunk.

## What it proves (maps to acceptance criteria)

- Grammar Points resolve to **stable Inventory IDs** (`GP_PAST_SIMPLE`, `GP_USED_TO`) — classification against the closed Grammar Inventory, never free-form (ADR-0003).
- Chunks are **canonicalized**: `made a decision` → canonical `make decision`; `have a big impact` → `have big impact`. Surface variants collapse to one entity (ADR-0004).
- Chunks are **tiered**: anchored Chunks carry a stable `inventoryId` + `confidence=anchored`; the novel collocation is `inventoryId=null` + `confidence=candidate` (ADR-0004).
- Each Inventory entry is **CEFR-tagged** with a derived fine Level (shown as `level=...`) and one authored Vietnamese explanation (see the Inventory seed files / `inventory.spec.ts`).

## Test run (green)

```
$ yarn test:unit --testPathPatterns "modules/lessons"

Test Suites: 7 passed, 7 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Ran all test suites matching modules/lessons.
```

New suites added by this issue:
- `canonical-chunk.util.spec.ts` — canonicalization collapses variants to one form.
- `inventory.spec.ts` — both Inventories: stable/unique/prefixed IDs, CEFR + Level, one authored Vietnamese explanation each, canonical-form consistency.
- `grammar-matcher.adapter.spec.ts` — classifies to stable Inventory IDs, never free-form, counts each point once.
- `chunk-matcher.adapter.spec.ts` — anchored vs candidate tiering, canonicalization, dedup by canonical form.

Full backend unit run: **110 passed**. (One unrelated suite,
`firebase-credential-loader.spec.ts`, fails to *load* because a gitignored test
fixture `test/fixtures/firebase-service-account.json` is absent in this
environment — pre-existing, outside this issue's scope.)

`yarn lint` clean (only pre-existing warnings). `yarn build` passes.

## Sample createLesson-path output (real matchers)

```
=== Source ===
The team has finally made a decision after weeks of debate. They used to avoid hard choices, but now they look forward to the challenge. A clear process will have a big impact on how they take care of clients.

=== Grammar Points (classified against the closed Grammar Inventory, ADR-0003) ===
  [grammar_point] inventoryId=GP_PAST_SIMPLE  name="past simple"  surface="used"  level=25
  [grammar_point] inventoryId=GP_USED_TO  name="used to + V"  surface="used to avoid"  level=42

=== Chunks (hybrid: reference Inventory anchors + LLM candidates, ADR-0004) ===
  [chunk] inventoryId=CH_MAKE_DECISION  canonical="make decision"     surface="made a decision"    confidence=anchored   level=42
  [chunk] inventoryId=CH_LOOK_FORWARD_TO canonical="look forward to"  surface="look forward to"    confidence=anchored   level=42
  [chunk] inventoryId=CH_TAKE_CARE_OF    canonical="take care of"     surface="take care of"       confidence=anchored   level=42
  [chunk] inventoryId=null               canonical="have big impact"  surface="have a big impact"  confidence=candidate  level=58
```

Note the canonical Chunk collapse — `made a decision` (surface) → `make decision`
(canonical, the dedup key) — and the tiering: three anchored Chunks with stable
`CH_*` IDs and one lower-confidence candidate with a null ID.

## Deferred (HITL)

Authoring/curating the full ~150–250-entry Inventories (the long tail of Grammar
Points and Chunks plus human-reviewed Vietnamese explanations) is a Human-In-The-Loop
content task per ADR-0003 / ADR-0004. This slice seeds a **representative starter
Inventory** across CEFR bands using the production schema (stable IDs + CEFR tag +
one authored Vietnamese explanation each); the matching logic, canonicalization,
tiering, and wiring into `createLesson` are **real and complete**.
