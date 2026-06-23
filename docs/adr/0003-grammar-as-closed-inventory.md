# Grammar Points are a closed Inventory the engine classifies against, not free-form extraction

Notable grammar is modeled as a **closed Grammar Inventory** — a predefined catalog of ~150–250 grammar points, each pre-mapped to a CEFR band and carrying one authored-once Vietnamese explanation. When analyzing a Source, the engine performs **classification** ("which inventory points appear in these sentences?") rather than open generation ("describe the grammar here"). We chose this over letting the LLM extract grammar freely.

Free-form extraction was rejected because it produces noise (tagging trivially-present structures), inconsistency (the same structure named differently across Lessons), and — most damaging — non-stable entities that can't be reliably counted for the North Star, reviewed in SRS, or deduped.

## Consequences

- Grammar Points have stable IDs: countable, reviewable, dedup-able, and Level-aware for the per-learner Candidate Item projection (ADR-0001 / the A2-vs-C1 split).
- Explanations are written once per inventory entry and reused everywhere — higher quality and cheaper than re-explaining per Lesson, and they fit the shared derived-layer cache.
- Someone must author and maintain the Inventory (a real upfront content task); coverage gaps mean some real grammar goes untagged until the catalog grows.
- The same closed-catalog principle is a candidate for Chunks later, but Chunks are more open-ended so they stay extraction-based for now.
