/**
 * Light SRS — the optional, never-mandatory review layer (CONTEXT.md → "SRS";
 * ADR there: review is an opportunity, not a debt).
 *
 * Two faces, both deliberately low-pressure:
 *   1. **Review-in-context** — already-Absorbed Items are re-surfaced inside
 *      *new* Lessons so review feels like natural re-encounter. (That rendering
 *      lives in the Reading player via `preAbsorbedItems`; this module only
 *      exposes the selection rule so it can be reasoned about / tested.)
 *   2. **Optional 60-second quick review** — a short, learner-chosen pass over a
 *      handful of rarely-re-encountered Absorbed Items.
 *
 * Hard constraints (the acceptance contract):
 *   - **No due-queue.** There is no "items due today" count gating anything.
 *   - **No red debt badge.** Nothing here computes overdue/backlog pressure.
 *   - The quick review is always *opt-in*; skipping it costs the learner nothing.
 */

import type {Item} from '@/features/lesson/types';

/** How many Items a single 60-second quick review surfaces at most. */
export const QUICK_REVIEW_SIZE = 8;

/**
 * A single quick-review prompt: an Absorbed Item shown for a quick "Nhớ /
 * Chưa nhớ" self-check. It carries the Item plus its Native-Language answer —
 * no scheduling metadata, because there is no due-queue.
 */
export interface QuickReviewPrompt {
  item: Item;
  /** The Native-Language meaning revealed as the answer. */
  answer: string;
}

/**
 * Pick the Items for an optional 60-second quick review from the learner's
 * Absorbed store. Prefers the **least-recently re-encountered** (those a learner
 * is least likely to have seen review-in-context) and caps the set small enough
 * to finish in ~60 seconds. Returns at most {@link QUICK_REVIEW_SIZE} prompts.
 *
 * This is a *selection*, not a schedule: there is no notion of "due", and an
 * empty result simply means there is nothing worth a quick review right now —
 * never a backlog to clear.
 *
 * @param absorbed   the learner's Absorbed Items (the personal store)
 * @param lastSeenAt optional map of Item id → epoch ms last re-encountered;
 *                   older (or absent) entries sort first
 */
export function selectQuickReview(
  absorbed: Item[],
  lastSeenAt: Record<string, number> = {},
): QuickReviewPrompt[] {
  const ranked = [...absorbed].sort(
    (a, b) => (lastSeenAt[a.id] ?? 0) - (lastSeenAt[b.id] ?? 0),
  );
  return ranked
    .slice(0, QUICK_REVIEW_SIZE)
    .map(item => ({item, answer: item.meaning}));
}
