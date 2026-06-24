/**
 * Behavior tests over the core-intro ordering + navigation helpers — the pure
 * logic behind the Lesson Player's **core** step (the flashcard preview of
 * "Lõi chung", screens.md §9–10b; design handoff `#core` step 3).
 *
 * These assert the rules the issue's acceptance criteria depend on:
 *   - Items are introduced one at a time, grouped Vocabulary → Chunk → Grammar
 *     Point — matching the handoff's `lpCoreOrder`;
 *   - prev / next clamps at the ends, so the index never escapes the deck;
 *   - jump-to-index counts and last-card detection drive the dots + CTA.
 */

import {GOLDEN_FIRST_LESSON} from './goldenFirstLesson';
import {
  clampCoreIndex,
  coreIntroOrder,
  coreKindCounts,
  isFirstCore,
  isLastCore,
} from './coreIntro';
import type {Item} from './types';

const ITEMS = GOLDEN_FIRST_LESSON.items;

describe('coreIntroOrder', () => {
  it('introduces Items grouped Vocabulary → Chunk → Grammar Point', () => {
    const order = coreIntroOrder(ITEMS).map(i => i.id);
    // The exact handoff order (lpCoreOrder) for the Golden First Lesson.
    expect(order).toEqual([
      'reshaping',
      'adopt',
      'reluctant',
      'giveup',
      'lookfwd',
      'cond',
    ]);
  });

  it('keeps every projected Item exactly once', () => {
    const order = coreIntroOrder(ITEMS);
    expect(order).toHaveLength(ITEMS.length);
    expect(new Set(order.map(i => i.id)).size).toBe(ITEMS.length);
  });

  it('is stable within a type group and does not mutate the input', () => {
    const input: Item[] = [...ITEMS];
    const snapshot = input.map(i => i.id);
    coreIntroOrder(input);
    expect(input.map(i => i.id)).toEqual(snapshot);
  });

  it('returns an empty deck for an empty Lesson', () => {
    expect(coreIntroOrder([])).toEqual([]);
  });
});

describe('coreKindCounts', () => {
  it('counts each Item type for the segmented header', () => {
    expect(coreKindCounts(ITEMS)).toEqual({
      vocabulary: 3,
      chunk: 2,
      grammarPoint: 1,
    });
  });
});

describe('clampCoreIndex', () => {
  it('clamps below zero to the first card', () => {
    expect(clampCoreIndex(-3, 6)).toBe(0);
  });

  it('clamps past the end to the last card', () => {
    expect(clampCoreIndex(99, 6)).toBe(5);
  });

  it('passes a valid index through unchanged', () => {
    expect(clampCoreIndex(2, 6)).toBe(2);
  });

  it('returns 0 for an empty deck', () => {
    expect(clampCoreIndex(2, 0)).toBe(0);
  });
});

describe('isFirstCore / isLastCore', () => {
  it('detects the first card (prev disabled)', () => {
    expect(isFirstCore(0)).toBe(true);
    expect(isFirstCore(1)).toBe(false);
  });

  it('detects the last card (next becomes "Bắt đầu đọc")', () => {
    const total = coreIntroOrder(ITEMS).length;
    expect(isLastCore(total - 1, total)).toBe(true);
    expect(isLastCore(0, total)).toBe(false);
  });

  it('never reports a last card for an empty deck', () => {
    expect(isLastCore(0, 0)).toBe(false);
  });
});
