/**
 * Daily Goal → Streak logic (CONTEXT.md → "Daily Goal", "Streak").
 *
 * The self-set **Daily Goal** (e.g. 10 minutes of Input, or 5 new Items) defines
 * whether a day counts toward the **Streak** — the count of consecutive days the
 * learner met that goal. Both are advanced **only by real learning** (completing
 * Lessons / absorbing Items); **Challenges never call into this** (they have a
 * separate indicator and do not keep the learning Streak alive).
 *
 * Pure, date-injectable functions so the day-boundary behavior is unit-testable
 * without faking the clock — the reducer passes `todayKey()` in.
 */

import type {DailyGoalUnit} from '@/features/home/homeSlice';

/** A calendar day as `YYYY-MM-DD` in the device's local time (the streak unit). */
export type DayKey = string;

/** Today's local calendar day key (the unit the Streak counts in). */
export function todayKey(now: Date = new Date()): DayKey {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The local calendar day key for the day before `day`. */
export function previousDayKey(day: DayKey): DayKey {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

/**
 * The learning contributed by one Completed Lesson, in both goal units, so a
 * single completion can satisfy a minute-goal or an Item-goal learner.
 */
export interface CompletionContribution {
  /** Minutes of Input from this Lesson (toward a `minutes` Daily Goal). */
  minutes: number;
  /** Items Absorbed this Lesson (toward an `items` Daily Goal). */
  absorbed: number;
}

/** Today's progress toward the goal, measured in the goal's own unit. */
export function progressInUnit(
  contribution: CompletionContribution,
  unit: DailyGoalUnit,
): number {
  return unit === 'minutes' ? contribution.minutes : contribution.absorbed;
}

/** Whether a given progress amount meets the Daily Goal target. */
export function isGoalMet(progress: number, target: number): boolean {
  return target > 0 && progress >= target;
}

export interface StreakState {
  /** Consecutive days the Daily Goal was met. */
  streak: number;
  /** The last day the goal was met (`null` before any qualifying day). */
  lastGoalMetDay: DayKey | null;
}

export interface StreakAdvance extends StreakState {
  /** Whether the goal was met for `today` (drives the folded "goal met" badge). */
  goalMetToday: boolean;
  /** True only on the day the goal first flips to met (fires the celebration). */
  becameMetToday: boolean;
}

/**
 * Advance the Streak for a day on which the learner met (or did not yet meet)
 * their Daily Goal — driven by real learning only.
 *
 * Rules:
 *   - The goal must be met for the streak to move.
 *   - Meeting it again the SAME day does not double-count (idempotent per day);
 *     it stays met but the streak is unchanged.
 *   - Meeting it the day AFTER the last qualifying day extends the streak (+1).
 *   - Meeting it after a gap (or for the first time) restarts the streak at 1.
 */
export function advanceStreak(
  prev: StreakState,
  today: DayKey,
  goalMet: boolean,
): StreakAdvance {
  if (!goalMet) {
    return {
      streak: prev.streak,
      lastGoalMetDay: prev.lastGoalMetDay,
      goalMetToday: prev.lastGoalMetDay === today,
      becameMetToday: false,
    };
  }

  // Already counted today — idempotent, no double-count, no re-celebration.
  if (prev.lastGoalMetDay === today) {
    return {
      streak: prev.streak,
      lastGoalMetDay: today,
      goalMetToday: true,
      becameMetToday: false,
    };
  }

  // First qualifying day, or one that continues / restarts the run.
  const continues = prev.lastGoalMetDay === previousDayKey(today);
  const streak = continues ? prev.streak + 1 : 1;
  return {
    streak,
    lastGoalMetDay: today,
    goalMetToday: true,
    becameMetToday: true,
  };
}
