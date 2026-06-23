# Include full Listening Replay (incl. podcast ASR with timestamps) in the MVP

The Listening Replay Practice Mode — re-hearing each Item/sentence with the original audio — ships in the MVP for **all** audio Sources, including podcasts and uncaptioned video, not just YouTube-with-captions. We deliberately rejected the lower-risk "reading-first" cut (text + YouTube captions only, podcast deferred) in favor of delivering the full reading+listening vision from day one, consistent with having already split Reading and Listening into separate Levels.

## Consequences

- Requires a word/sentence-level timestamped ASR pipeline (vendor + job queue + long-audio handling) from launch — the heaviest technical piece and the main launch-date risk.
- Higher variable cost per uncaptioned audio Source; the $12/mo Paid Plan must absorb podcast-heavy users, making the global Source cache (ADR-0001) essential for amortizing ASR cost.
- Audio↔text↔Item synchronization (highlighting the spoken word, replaying the right span) is UX-fragile and needs careful testing.
- **Generation strategy:** curated content (Starter Series, the pool) is pre-generated during QA so the aha moment never waits on ASR; user-imported audio is aligned lazily on first Listening Replay open.
- **Caching boundary (refines ADR-0001):** Item-level and sentence-level **timestamps are objective derived data, cached in the shared layer** (generated once, replayable by everyone). The **full transcript text stays in the importer-private layer** — so per-Item Listening Replay works for all learners without re-hosting the full transcript of copyrighted audio.
- Launch is later than a reading-first MVP would have been; we accept the speed-for-completeness trade.
