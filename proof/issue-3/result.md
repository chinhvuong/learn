# Proof of work — Issue #3: Lesson Creation Engine tracer

`createLesson(SourceInput) -> Lesson[]` — the backend tracer bullet for the
Lesson Creation Engine. A pasted-text Source flows through the staged pipeline
(Ingest → Cache check → Analyze → Translate → Segment → Assemble, ADR-0005) and
produces a Lesson with typed Items, every external adapter faked behind a port.

This is a backend / non-visual slice, so proof is the passing behavior-test
output plus a sample `createLesson` input → output (the produced `Lesson[]` with
typed Items) and a cache-hit demonstration.

## Passing test output

Reference behavior test at the `createLesson` seam — all ports + repositories
faked (no live Postgres):

```
$ yarn test:unit --testPathPatterns lessons
Test Suites: 3 passed, 3 total
Tests:       19 passed, 19 total
Ran all test suites matching lessons.
```

The lesson suites:

- `test/unit/modules/lessons/lesson-creation-engine.spec.ts` — the reference
  behavior test (typed-and-counted-once Items, persists Source/Candidate/Lesson/
  Item, cache hit skips re-analysis, failed creation consumes no Credit, private
  Sources stay non-pool-eligible, short → one Lesson / long → many).
- `test/unit/modules/lessons/segment-source.util.spec.ts`
- `test/unit/modules/lessons/source-fingerprint.util.spec.ts`

Full unit suite: `82 passed, 82 total`. (One pre-existing suite,
`firebase-credential-loader.spec.ts`, errors only because its gitignored fixture
`test/fixtures/firebase-service-account.json` is absent in this environment —
unrelated to issue #3, which touches nothing in auth.)

Lint: `yarn lint` → `0 errors` (4 pre-existing warnings in untouched
`src/shared/` files). Build: `yarn build` passes.

## Sample createLesson input → output

### Input (`SourceInput`)

```json
{
  "type": "text",
  "title": "Making decisions",
  "text": "She used to give up easily but has learned to make a decision and look forward to it."
}
```

### Output (`Lesson[]`) — one Lesson; common core = typed Items + Bilingual Passage + original text

```json
[
  {
    "id": "id-12",
    "sourceId": "id-1",
    "segmentIndex": 0,
    "durationSeconds": 5,
    "originalText": "She used to give up easily but has learned to make a decision and look forward to it.",
    "bilingualPassage": "[vi] She used to give up easily but has learned to make a decision and look forward to it.",
    "items": [
      { "type": "grammar_point", "lemma": "present perfect", "surface": "has", "inventoryId": "GP_PRESENT_PERFECT", "confidence": "anchored", "level": 45 },
      { "type": "grammar_point", "lemma": "used to + V", "surface": "used to", "inventoryId": "GP_USED_TO", "confidence": "anchored", "level": 40 },
      { "type": "chunk", "lemma": "give up", "surface": "give up", "inventoryId": "CH_GIVE_UP", "confidence": "anchored", "level": 35 },
      { "type": "chunk", "lemma": "make a decision", "surface": "make a decision", "inventoryId": "CH_MAKE_A_DECISION", "confidence": "anchored", "level": 40 },
      { "type": "chunk", "lemma": "look forward to", "surface": "look forward to", "inventoryId": null, "confidence": "candidate", "level": 50 },
      { "type": "vocabulary", "lemma": "she", "surface": "She", "inventoryId": null, "confidence": "anchored", "level": 30 },
      { "type": "vocabulary", "lemma": "easily", "surface": "easily", "inventoryId": null, "confidence": "anchored", "level": 30 },
      { "type": "vocabulary", "lemma": "but", "surface": "but", "inventoryId": null, "confidence": "anchored", "level": 30 },
      { "type": "vocabulary", "lemma": "learned", "surface": "learned", "inventoryId": null, "confidence": "anchored", "level": 30 },
      { "type": "vocabulary", "lemma": "and", "surface": "and", "inventoryId": null, "confidence": "anchored", "level": 30 }
    ]
  }
]
```

All three Item types are present, each counted once: the words inside matched
Chunks / Grammar Points (`give`, `up`, `make`, `decision`, `look`, `forward`,
`used`) are **not** also emitted as Vocabulary — the dedup rule (Chunk / Grammar
Point take precedence). Anchored Items carry a stable Inventory id
(ADR-0003/0004); the novel `look forward to` is a lower-confidence `candidate`
Chunk with no Inventory id (ADR-0004).

### Persisted derived layer

```json
{
  "sources": 1,
  "candidateItems": 10,
  "lessons": 1,
  "items": 10,
  "source0": {
    "contentHash": "0cb5df7aa589be2f52d3b8c21c37e12bcba58cda29a86b8b14e79d415e691d97",
    "normalizedUrl": null,
    "poolEligible": false
  }
}
```

The shared objective set is the 10 CandidateItems (extracted once per Source);
the Lesson's Items project them. The Source carries the hybrid fingerprint
(content-hash always present; `normalizedUrl` null for pasted text) and a private
text Source is `poolEligible: false` (importer-private, ADR-0001).

## Cache-hit demonstration

Re-importing the identical text a second time matches on the content-hash
(authoritative half of the hybrid fingerprint, ADR-0001), so the engine skips
re-analysis and serves the existing Lessons:

```json
{
  "before": { "sources": 1, "candidateItems": 10, "lessons": 1 },
  "after":  { "sources": 1, "candidateItems": 10, "lessons": 1 },
  "sameLessonIds": true
}
```

No new Source, no new CandidateItems, no new Lessons — and the same Lesson ids
are returned.
