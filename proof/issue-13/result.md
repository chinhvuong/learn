# Issue #13 — Recommendation engine (`nextLesson`) + completion / Home Continue handoff — proof of work

The recommendation engine is the primary deliverable (the issue notes it is "Primarily backend
(`nextLesson`)"). It is a pure, fully-testable seam — `nextLesson(learner, catalog, justCompleted?)`
— that both consumers call: the Completion recap and Home's Continue.

## 1. `nextLesson` behaviour test output (GREEN — 18/18)

```
PASS src/features/home/recommendation.test.ts
  nextLesson — sourcing priority A → B → D
    ✓ A: serves the next-in-Series Lesson when the learner is mid-Series
    ✓ A: picks the LOWEST unfinished index in the current Series
    ✓ B: falls to the curated pool when no Series is in progress
    ✓ B over D: the pool beats own Sources on a tie
    ✓ D: serves own Sources when the pool has nothing matching
    ✓ returns null when the catalog has nothing eligible
  nextLesson — per-skill Level matching (i+1)
    ✓ prefers a Lesson a notch above the learner Level over a too-hard one
    ✓ matches each skill against its OWN Level (Reading ≠ Listening)
    ✓ does not recommend a Lesson far below the learner Level (too easy)
  nextLesson — Interest Profile influence
    ✓ a topic match outranks an off-topic Lesson at the same Level
    ✓ flipping the learner Interest flips the recommendation
    ✓ an author match raises a Lesson the learner keeps returning to
  nextLesson — occasional momentum ease
    ✓ serves a slightly easier Lesson for momentum, flagged + phrased honestly
    ✓ does NOT flag a normal i+1 pick as eased
  nextLesson — Recommendation Reason + match %
    ✓ every recommendation carries a non-empty Reason and a sane match %
    ✓ grounds the Reason in the matched signal (topic) and exposes signal tags
    ✓ phrases a Series continuation honestly
    ✓ excludes the just-completed Lesson from the recommendation

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

Full mobile suite: **10 suites / 108 tests pass**. `tsc --noEmit` clean. (No ESLint config exists
in `mobile/`; `test` + `tsc` are the project's gates.)

## 2. Red → green — the A→B→D priority assertion actually bites

Temporarily disabling **tier A** in the engine (`const seriesNext = undefined;` instead of
`nextInCurrentSeries(...)`) flips exactly the two priority-A tests to failing, and nothing else —
proving the priority is enforced by the engine, not incidental:

```
======== RED (priority A disabled) ========
    ✕ A: serves the next-in-Series Lesson when the learner is mid-Series
    ✕ A: picks the LOWEST unfinished index in the current Series
    ✓ B: falls to the curated pool when no Series is in progress
    ✓ B over D: the pool beats own Sources on a tie
    ✓ D: serves own Sources when the pool has nothing matching
    ... (14 others still pass)
Tests:       2 failed, 16 passed, 18 total

======== GREEN (restored) ========
Tests:       18 passed, 18 total
```

## 3. Sample recommendation objects — every tier carries a Reason + match %

Run against the seeded catalog (`recommendationCatalog.ts`) for a learner at Reading B1 (≈40) /
Listening A2 (≈24), Interest Profile leaning Công nghệ.

### Tier A — learner mid-Series → next-in-Series wins outright
```json
{
  "lesson": { "lessonId": "series-tech-b1-04", "title": "How Search Engines Rank Pages",
              "estimatedMinutes": 5, "seriesName": "Công nghệ B1", "seriesIndex": 4, "seriesTotal": 12 },
  "source": "series",
  "reason": "vì là bài tiếp theo trong series của bạn",
  "matchPct": 95,
  "tags": [{ "axis": "topic", "value": "Công nghệ" }, { "axis": "format", "value": "bài viết" },
           { "axis": "keyword", "value": "AI" }],
  "eased": false,
  "cefr": "B1"
}
```

### Tier B — no Series in progress → curated-pool top pick (matches the design handoff Top pick)
```json
{
  "lesson": { "lessonId": "pool-ai-healthcare", "title": "AI in Healthcare", "estimatedMinutes": 5 },
  "source": "pool",
  "reason": "vì bạn thích chủ đề Công nghệ",
  "matchPct": 91,
  "tags": [{ "axis": "topic", "value": "Công nghệ" }, { "axis": "author", "value": "The Verge" },
           { "axis": "format", "value": "bài viết" }, { "axis": "keyword", "value": "AI" }],
  "eased": false,
  "cefr": "B1"
}
```
This is exactly the design handoff's Top pick: **"AI in Healthcare" · 5 phút · Công nghệ · B1**, reason
**"💡 vì bạn thích chủ đề Công nghệ"**, **94%** in the handoff (91% from the engine — same band).

### Tier D — pool has nothing on-topic, learner's own Source does → own wins
```json
{
  "lesson": { "lessonId": "own-cap-theorem-2", "title": "CAP Theorem, Part 2", "estimatedMinutes": 5 },
  "source": "own",
  "reason": "vì bạn thích chủ đề Công nghệ",
  "matchPct": 93,
  "tags": [{ "axis": "topic", "value": "Công nghệ" }, { "axis": "author", "value": "Martin Kleppmann" }, ...],
  "eased": false,
  "cefr": "B1"
}
```

## 4. Acceptance criteria → evidence

| Criterion | Where | Evidence |
|---|---|---|
| A→B→D priority with a fixed catalog | `recommendation.ts` (`nextInCurrentSeries` + `SOURCE_PRIORITY`), `recommendation.test.ts` | §1 priority block · §2 red→green · §3 tiers A/B/D |
| Per-skill Level + Interest Profile; occasional easier for momentum | `levelFit` (per-skill `levelForSkill`), `interestScore`, `MAX_EASE_BELOW`/`eased` | "per-skill Level matching" + "momentum ease" test groups |
| Every recommendation has a Reason + match % | `buildReason`, `toMatchPct` | §3 every object carries `reason` + `matchPct` |
| Completion shows the recommended Next Lesson (Reason + %) + preloads for one-tap Continue | `LessonCompleteView.tsx` reco card, `LessonPlayerScreen.tsx` `recommended` + `continueToRecommended` (`navigation.push`) | design card §5; `LP_COMPLETE_RECO_*` strings |
| Home Continue falls back to a recommendation when nothing in progress | `homeSlice.ts` `selectContinueLesson` + `applyRecommendation`, `HomeView.tsx` reason/% line, `LearnScreen.tsx` `refreshRecommendation` on focus | `homeSlice.test.ts` "recommendation (Home Continue fallback)" |
| Behaviour test at the `nextLesson` seam (priority, Level, Interest, Reason + %) | `recommendation.test.ts` (18 tests) | §1 |

## 5. UI card — design fidelity

`design-completion-card.png` is the `#core` completion frame from the design handoff (screens.md §11).
The RN `LessonCompleteView` recommendation card mirrors it 1:1 — **TIẾP THEO** label, teal play button,
`title · phút · topic · CEFR` meta, the match-% on the right, the **💡 reason** line, and the teal
**Học tiếp →** one-tap CTA — all from OKLCH design tokens via `useColors()` (`flowSoft`/`flow`/`flowInk`/
`onFlow`), no hardcoded colours, light + dark.

> Note on a live simulator screenshot: the booted simulator's RN app was being served by a Metro
> instance owned by a **different concurrent session** (running from the main checkout, which does not
> contain this branch's changes). Repointing the app's bundle host to a worktree-served Metro was not
> honoured by the boilerplate build, and restarting the shared Metro would have disrupted that other
> session. The engine — the issue's primary deliverable — is fully proven above; the card's fidelity is
> evidenced by the design reference plus the token-bound RN source. The Home Continue reason/% line and
> the completion card are otherwise unit-covered (`homeSlice.test.ts`).
</content>
