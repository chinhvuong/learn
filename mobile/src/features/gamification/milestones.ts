/**
 * Gamification milestone detection — the pure logic behind the two-tier
 * **Celebration** (CONTEXT.md → "Celebration moment", "Milestone Card";
 * screens.md §12).
 *
 * Celebrations are two-tier to avoid fatigue:
 *   - **Daily Goal met** (an everyday event) is folded into the Lesson-complete
 *     screen as a small "goal met" badge — no dedicated screen.
 *   - A **major milestone** (Streak 7/30/100, a **Level up**, a round North Star
 *     number) earns a dedicated full-screen Celebration with confetti and a
 *     shareable **Milestone Card**.
 *
 * This module is pure (no React, no Redux) so the rules are unit-testable and
 * the same detection drives both the completion folding and the Profile trophy
 * case. It works off the BEFORE/AFTER snapshot of the learner's gamification
 * state around a Completed Lesson — never off re-extraction.
 *
 * Important boundaries (the acceptance contract):
 *   - The **Streak** is driven only by real learning (Completed Lessons /
 *     absorbing Items). **Challenges never count** — the Challenge feed has its
 *     own separate indicator and must not call into this module.
 *   - A **Level up** fires automatically from behavior when a fine 0–100 Level
 *     score crosses a CEFR band boundary (A2→B1, …) — there is never a test.
 */

import {scoreToCefr} from '@/features/home/cefr';
import type {CefrBand} from '@/features/lesson/types';

/** The Streak lengths that earn a full-screen Celebration (CONTEXT.md → §12). */
export const STREAK_MILESTONES = [7, 30, 100] as const;

/** Round North Star totals that earn a Celebration (e.g. 1,000 Items Absorbed). */
export const NORTH_STAR_STEP = 1000;

/** Which skill a Level-up belongs to (the two separate Levels). */
export type LevelSkill = 'reading' | 'listening';

/**
 * One major milestone worth a full-screen Celebration + Milestone Card. Exactly
 * one of three kinds, each carrying just enough to render the card and the
 * share text — never the whole learner state.
 */
export type Milestone =
  | {
      kind: 'streak';
      /** The Streak length reached (7, 30 or 100). */
      days: number;
      /** North Star at the moment of the milestone (shown on the card). */
      northStar: number;
    }
  | {
      kind: 'levelUp';
      /** Which skill levelled up (Reading or Listening). */
      skill: LevelSkill;
      /** The band just left behind (e.g. A2). */
      fromBand: CefrBand;
      /** The new band reached (e.g. B1). */
      toBand: CefrBand;
    }
  | {
      kind: 'northStar';
      /** The round North Star total reached (e.g. 1000). */
      total: number;
    };

/**
 * A snapshot of the gamification fields that milestone detection compares
 * before vs. after a Completed Lesson.
 */
export interface GamificationSnapshot {
  northStar: number;
  streak: number;
  readingLevel: number;
  listeningLevel: number;
}

/**
 * Detect every major milestone crossed between two snapshots of the learner's
 * gamification state (the BEFORE/AFTER of a Completed Lesson). Returns them in
 * the order they should be celebrated; an empty array means only the everyday
 * Daily-Goal tier applies (no full-screen Celebration).
 *
 * Detection is **crossing-based**, never threshold-based, so a milestone fires
 * exactly once — the single Level-up moment of the acceptance criteria — even
 * if the learner lingers above the boundary across many Lessons.
 */
export function detectMilestones(
  before: GamificationSnapshot,
  after: GamificationSnapshot,
): Milestone[] {
  const milestones: Milestone[] = [];

  // Level up — a fine score crossed a CEFR band boundary (no test). Checked per
  // skill because the two Levels move independently (reading commonly outpaces
  // listening). Fires once, on the crossing.
  (['reading', 'listening'] as const).forEach(skill => {
    const key = skill === 'reading' ? 'readingLevel' : 'listeningLevel';
    const fromBand = scoreToCefr(before[key]);
    const toBand = scoreToCefr(after[key]);
    if (fromBand !== toBand && after[key] > before[key]) {
      milestones.push({kind: 'levelUp', skill, fromBand, toBand});
    }
  });

  // Streak — a milestone length (7/30/100) was reached this completion.
  STREAK_MILESTONES.forEach(days => {
    if (before.streak < days && after.streak >= days) {
      milestones.push({kind: 'streak', days, northStar: after.northStar});
    }
  });

  // North Star — a round thousand was crossed (1,000 Items Absorbed, …).
  const beforeStep = Math.floor(before.northStar / NORTH_STAR_STEP);
  const afterStep = Math.floor(after.northStar / NORTH_STAR_STEP);
  if (afterStep > beforeStep && afterStep > 0) {
    milestones.push({kind: 'northStar', total: afterStep * NORTH_STAR_STEP});
  }

  return milestones;
}

/**
 * The single highest-priority milestone to celebrate full-screen, if any. When
 * several cross at once we surface the rarest/biggest first: Level up (a real
 * proficiency jump) > Streak > North Star.
 */
export function primaryMilestone(milestones: Milestone[]): Milestone | null {
  const order: Milestone['kind'][] = ['levelUp', 'streak', 'northStar'];
  for (const kind of order) {
    const found = milestones.find(m => m.kind === kind);
    if (found) {
      return found;
    }
  }
  return null;
}
