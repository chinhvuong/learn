/**
 * Core-intro ordering + navigation — the pure logic behind the Lesson Player's
 * **core** step (the flashcard-style introduction of each new Item one at a
 * time, before the reading surface).
 *
 * "Lõi chung" (the common core) is previewed grouped by Item type — Vocabulary
 * → Chunk → Grammar Point — mirroring the design handoff's `lpCoreOrder`
 * (`reshaping, adopt, reluctant, giveup, lookfwd, cond` for the Golden First
 * Lesson). This is presentation order only; it never touches the projected /
 * completion set owned by the session reducer (ADR-0001: personalization stays
 * out of the shared derived layer).
 */

import type {ItemKind} from '@/components/ui/ItemToken';
import type {Item} from './types';

/** Type-grouping order for the core preview (Vocabulary → Chunk → Grammar Point). */
const CORE_KIND_ORDER: ItemKind[] = ['vocabulary', 'chunk', 'grammarPoint'];

/**
 * The Items in core-intro order — grouped by type, stable within a group. Pure;
 * does not mutate the input.
 */
export function coreIntroOrder(items: Item[]): Item[] {
  return CORE_KIND_ORDER.flatMap(kind =>
    items.filter(item => item.type === kind),
  );
}

/** Clamp a requested core index into the valid [0, length-1] range. */
export function clampCoreIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}

/** Whether the given index is the last card in the core preview. */
export function isLastCore(index: number, length: number): boolean {
  return length > 0 && index >= length - 1;
}

/** Whether the given index is the first card in the core preview. */
export function isFirstCore(index: number): boolean {
  return index <= 0;
}

/** Per-type counts for the core preview segmented header (📘/🧩/⚙). */
export function coreKindCounts(items: Item[]): {
  vocabulary: number;
  chunk: number;
  grammarPoint: number;
} {
  return {
    vocabulary: items.filter(i => i.type === 'vocabulary').length,
    chunk: items.filter(i => i.type === 'chunk').length,
    grammarPoint: items.filter(i => i.type === 'grammarPoint').length,
  };
}
