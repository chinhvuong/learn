/**
 * Behavior tests over the Daily Goal → Streak logic (issue #14 acceptance
 * criteria; CONTEXT.md → "Daily Goal", "Streak").
 *
 * These assert:
 *   - the self-set Daily Goal defines whether a day counts;
 *   - the Streak only advances on a met goal, idempotently per day;
 *   - consecutive days extend it; a gap restarts it at 1;
 *   - meeting it the first time opens the Streak at 1.
 */

import {
  advanceStreak,
  isGoalMet,
  previousDayKey,
  progressInUnit,
  todayKey,
} from './dailyGoal';

describe('todayKey / previousDayKey', () => {
  it('formats a local day as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 5, 24))).toBe('2026-06-24');
  });
  it('steps back one calendar day, across month boundaries', () => {
    expect(previousDayKey('2026-06-01')).toBe('2026-05-31');
    expect(previousDayKey('2026-06-24')).toBe('2026-06-23');
  });
});

describe('Daily Goal — met threshold (self-set target)', () => {
  it('is met when progress reaches the target', () => {
    expect(isGoalMet(10, 10)).toBe(true);
    expect(isGoalMet(12, 10)).toBe(true);
  });
  it('is not met below the target, or with a zero target', () => {
    expect(isGoalMet(9, 10)).toBe(false);
    expect(isGoalMet(5, 0)).toBe(false);
  });
  it('measures progress in the goal unit', () => {
    expect(progressInUnit({minutes: 8, absorbed: 3}, 'minutes')).toBe(8);
    expect(progressInUnit({minutes: 8, absorbed: 3}, 'items')).toBe(3);
  });
});

describe('Streak — advances only on a met goal, date-aware', () => {
  const base = {streak: 0, lastGoalMetDay: null as string | null};

  it('opens at 1 when the goal is first met', () => {
    const next = advanceStreak(base, '2026-06-24', true);
    expect(next.streak).toBe(1);
    expect(next.goalMetToday).toBe(true);
    expect(next.becameMetToday).toBe(true);
  });

  it('does not move when the goal is not met', () => {
    const next = advanceStreak({streak: 5, lastGoalMetDay: '2026-06-23'}, '2026-06-24', false);
    expect(next.streak).toBe(5);
    expect(next.goalMetToday).toBe(false);
    expect(next.becameMetToday).toBe(false);
  });

  it('extends by 1 on a consecutive day', () => {
    const next = advanceStreak({streak: 5, lastGoalMetDay: '2026-06-23'}, '2026-06-24', true);
    expect(next.streak).toBe(6);
    expect(next.becameMetToday).toBe(true);
  });

  it('restarts at 1 after a gap', () => {
    const next = advanceStreak({streak: 5, lastGoalMetDay: '2026-06-20'}, '2026-06-24', true);
    expect(next.streak).toBe(1);
  });

  it('is idempotent within the same day (no double-count, no re-celebration)', () => {
    const first = advanceStreak({streak: 5, lastGoalMetDay: '2026-06-23'}, '2026-06-24', true);
    expect(first.streak).toBe(6);
    const again = advanceStreak(
      {streak: first.streak, lastGoalMetDay: first.lastGoalMetDay},
      '2026-06-24',
      true,
    );
    expect(again.streak).toBe(6);
    expect(again.goalMetToday).toBe(true);
    expect(again.becameMetToday).toBe(false);
  });
});
