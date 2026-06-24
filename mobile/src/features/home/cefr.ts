/**
 * Level → CEFR display helpers.
 *
 * A learner's Level is stored internally as a fine 0–100 score so the
 * recommendation engine can match learners to suitably-difficult Lessons via
 * continuous i+1 (CONTEXT.md → "Level"); it is *displayed* to the learner as a
 * CEFR band (A1…C2). A learner has two separate Levels — Reading and Listening
 * — because reading proficiency commonly outpaces listening, so each fine score
 * maps to its band independently.
 */

import type {CefrBand} from '@/features/lesson/types';

export type {CefrBand};

/**
 * The six CEFR bands laid across the 0–100 fine score. A boundary is the point
 * the app fires a "Level up" Celebration when the score crosses it (no test).
 */
const CEFR_BANDS: {band: CefrBand; min: number}[] = [
  {band: 'A1', min: 0},
  {band: 'A2', min: 17},
  {band: 'B1', min: 34},
  {band: 'B2', min: 50},
  {band: 'C1', min: 67},
  {band: 'C2', min: 84},
];

/** Map a fine 0–100 Level score to the CEFR band shown to the learner. */
export function scoreToCefr(score: number): CefrBand {
  const clamped = Math.max(0, Math.min(100, score));
  let band: CefrBand = 'A1';
  for (const entry of CEFR_BANDS) {
    if (clamped >= entry.min) {
      band = entry.band;
    }
  }
  return band;
}
