# Chunks use a hybrid reference Inventory + LLM candidates, all normalized to canonical form

Chunks — the product's signature unit — are detected by a **hybrid** of a reference Chunk Inventory (curated collocation/phrasal-verb/idiom lists, each entry with a stable ID, an authored-once explanation, and a CEFR Level) plus LLM detection of novel collocations not in the Inventory, which are kept as lower-confidence, per-Source **candidates**. Every Chunk — anchored or candidate — is normalized to a **canonical lemmatized form** so surface variants (`make a decision` / `making decisions`) collapse to one entity.

We rejected pure open LLM extraction (the noise/inconsistency/non-stable-identity problems that ADR-0003 records for grammar) and rejected a closed-Inventory-only approach (Chunks are near-infinite; a fixed list would miss the everyday collocations that make the feature compelling). The hybrid keeps a stable countable core while preserving coverage.

## Consequences

- Chunks gain stable identity (like Grammar Points): honest counting for the North Star, reliable SRS and dedup, and Level-aware per-learner projection — but only after canonical normalization, which is therefore mandatory.
- Two confidence tiers exist (anchored vs candidate); the data model and UI must distinguish them, and there should be a path to promote a frequently-seen candidate into the Inventory.
- The Chunk Inventory, like the Grammar Inventory (ADR-0003), is an ongoing authored-content asset.
