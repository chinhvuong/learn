# Cache and share only the derived layer of public Sources; keep full text per-importer

To keep lesson-creation cost from scaling with users, a public-URL Source (YouTube, public article) is analyzed once and its **derived layer** (Items, grammar notes, level/topic tags) is cached and shared globally, becoming a candidate for the pre-generated pool. However, the **full bilingual passage / original full text is served only to the learner who imported it** — other learners re-fetch the original from its source rather than the app re-hosting copyrighted full text. Privately pasted text and uploaded files are never shared: they stay strictly per-user.

We chose this conservative boundary over the stronger option of caching and re-hosting full content for everyone (better UX and cost, but it amounts to republishing copyrighted work and risks both legal exposure and leaking private content). The pre-generated pool used for broad recommendation therefore favors content we have rights to (self-produced, open-licensed, or partnered); public imports contribute only their derived layer.

**Promotion gating.** A user-imported Source is, by default, served only to the importer. It is promoted into the shared recommendation pool (served to strangers) only after it both (a) passes an automated moderation + quality filter and (b) shows broad value — e.g. independently imported by several users, or cleared by a curator spot-check. Clearly illegal/abusive content (NSFW, hate, etc.) is blocked at the personal-use layer too, not just at promotion. This keeps one bad import from poisoning everyone's experience while still letting imports enrich the pool over time.

## Consequences

- The data model must distinguish a Source's shareable derived layer from its importer-private full content, and must hard-separate public-URL Sources from private text/file Sources.
- The shared derived layer is the **objective** set of Candidate Items (extracted once per Source). What each learner sees as "notable" is a **per-learner projection** of that set, filtered by their Level and Item Status — so personalization lives in a separate per-learner layer, not in re-extraction. This is what makes one-analysis-per-Source compatible with per-learner experiences.
- Cost scales with the number of unique public Sources, not with users.
- Source identity (the dedup/cache key) is **hybrid**: a normalized URL acts as a cheap fast-path (avoids re-fetching obvious repeats), and a content-hash of the normalized extracted text/transcript is the authoritative key (dedups the same content across different URLs, and pasted text matching a known Source). Near-duplicate (fuzzy/semantic) matching is deferred past MVP.
