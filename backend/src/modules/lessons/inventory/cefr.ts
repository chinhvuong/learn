/**
 * CEFR bands and their mapping to the fine 0–100 Level score (CONTEXT.md →
 * Level). Inventory entries are authored against a CEFR band; the engine and
 * recommendation work on the fine score, so each band maps to a representative
 * point near the middle of its range. Keeping this in one place stops band and
 * score from drifting apart across the two Inventories.
 */

/** The six CEFR proficiency bands, A1 (easiest) to C2 (hardest). */
export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Representative fine 0–100 Level score for each CEFR band — the midpoint of the
 * band's slice of the scale. Used to derive an Inventory entry's `level` from
 * its authored `cefr` so the two stay consistent (CONTEXT.md → Level).
 */
export const CEFR_TO_LEVEL: Readonly<Record<CefrBand, number>> = {
  A1: 8,
  A2: 25,
  B1: 42,
  B2: 58,
  C1: 75,
  C2: 92,
};
