/**
 * Behavior tests over the light SRS quick-review selection (issue #14 acceptance
 * criteria; CONTEXT.md → "SRS").
 *
 * These assert the low-pressure contract: a small, opt-in selection of Absorbed
 * Items — never a due-queue. There is no "due" concept here to test against;
 * what we verify is the cap, the least-recently-seen ordering, and that an empty
 * store yields nothing to review (no backlog).
 */

import {selectQuickReview, QUICK_REVIEW_SIZE} from './srs';
import type {Item} from '@/features/lesson/types';

const item = (id: string): Item => ({
  id,
  type: 'vocabulary',
  headword: id,
  meaning: `nghĩa ${id}`,
  cefr: 'B1',
  posLabel: 'từ · B1',
  example: '',
});

describe('selectQuickReview — light SRS', () => {
  it('returns at most QUICK_REVIEW_SIZE prompts (a 60s pass)', () => {
    const absorbed = Array.from({length: 20}, (_, i) => item(`w${i}`));
    expect(selectQuickReview(absorbed)).toHaveLength(QUICK_REVIEW_SIZE);
  });

  it('surfaces the least-recently re-encountered Items first', () => {
    const a = item('a');
    const b = item('b');
    const c = item('c');
    const prompts = selectQuickReview([a, b, c], {a: 100, b: 1, c: 50});
    expect(prompts.map(p => p.item.id)).toEqual(['b', 'c', 'a']);
  });

  it('pairs each prompt with its Native-Language answer', () => {
    const prompts = selectQuickReview([item('reluctant')]);
    expect(prompts[0].answer).toBe('nghĩa reluctant');
  });

  it('yields nothing for an empty store (no due-queue, no backlog)', () => {
    expect(selectQuickReview([])).toEqual([]);
  });
});
