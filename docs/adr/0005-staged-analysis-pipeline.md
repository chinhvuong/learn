# Lesson analysis is a staged pipeline, not one monolithic LLM call

The ANALYZE step of lesson creation is split by concern rather than done in one large LLM call. Cheap steps that need no reference data (sentence splitting, vocabulary extraction, topic/author/keyword/format metadata) are batched into one call; the steps that need an Inventory or are expensive are separated — **grammar classification** (against the Grammar Inventory, ADR-0003), **chunk matching** (against the Chunk Inventory, ADR-0004), and **bilingual translation** (expensive, cached on its own).

A single monolithic prompt was rejected: it would be unreliable at that size, impossible to cache or retry per-concern, and would force the full Grammar and Chunk Inventories into one overloaded prompt.

## Consequences

- Each stage caches and retries independently, and a cheaper model can be used for the easy stages while harder stages use a stronger one.
- The grammar/chunk stages receive only the relevant Inventory slice, keeping prompts small and classification accurate.
- The translation stage is cached separately and lives in the importer-private layer (ADR-0001), distinct from the shared derived layer.
- More orchestration is required (a job graph), and stages must agree on a shared sentence/offset representation so later stages can reference earlier output.
