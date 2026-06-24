/**
 * Behavior tests over milestone detection — the engine behind the two-tier
 * Celebration (issue #14 acceptance criteria; CONTEXT.md → "Celebration moment").
 *
 * These assert the acceptance contract:
 *   - crossing a CEFR band fires a single Level-up moment from behavior;
 *   - Streak 7/30/100 and round North Star totals trigger major milestones;
 *   - milestones fire exactly once (crossing-based, not threshold-based);
 *   - the Streak boundary is independent per skill.
 */

import {
  detectMilestones,
  primaryMilestone,
  type GamificationSnapshot,
} from './milestones';

const snap = (over: Partial<GamificationSnapshot>): GamificationSnapshot => ({
  northStar: 0,
  streak: 0,
  readingLevel: 0,
  listeningLevel: 0,
  ...over,
});

describe('detectMilestones — Level up (no test, from behavior)', () => {
  it('fires a single Level-up when a fine score crosses a CEFR band (A2→B1)', () => {
    // A2 = [17,34); B1 starts at 34. Cross 33 → 35.
    const before = snap({listeningLevel: 33});
    const after = snap({listeningLevel: 35});
    const found = detectMilestones(before, after);
    expect(found).toEqual([
      {kind: 'levelUp', skill: 'listening', fromBand: 'A2', toBand: 'B1'},
    ]);
  });

  it('does NOT fire when the score moves within the same band', () => {
    const before = snap({readingLevel: 35});
    const after = snap({readingLevel: 40}); // still B1
    expect(detectMilestones(before, after)).toEqual([]);
  });

  it('moves Reading and Listening independently', () => {
    const before = snap({readingLevel: 33, listeningLevel: 10});
    const after = snap({readingLevel: 35, listeningLevel: 12});
    const found = detectMilestones(before, after);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({kind: 'levelUp', skill: 'reading'});
  });
});

describe('detectMilestones — Streak 7/30/100', () => {
  it.each([7, 30, 100])('fires when the Streak reaches %i', days => {
    const before = snap({streak: days - 1});
    const after = snap({streak: days});
    const found = detectMilestones(before, after);
    expect(found).toContainEqual({kind: 'streak', days, northStar: 0});
  });

  it('does not fire for a non-milestone Streak length', () => {
    const before = snap({streak: 4});
    const after = snap({streak: 5});
    expect(detectMilestones(before, after)).toEqual([]);
  });
});

describe('detectMilestones — round North Star', () => {
  it('fires when a round thousand is crossed (1,000 Items Absorbed)', () => {
    const before = snap({northStar: 998});
    const after = snap({northStar: 1002});
    expect(detectMilestones(before, after)).toContainEqual({
      kind: 'northStar',
      total: 1000,
    });
  });

  it('does not fire when no thousand boundary is crossed', () => {
    const before = snap({northStar: 1200});
    const after = snap({northStar: 1240});
    expect(detectMilestones(before, after)).toEqual([]);
  });
});

describe('primaryMilestone — priority', () => {
  it('prefers a Level up over a Streak over a North Star', () => {
    const before = snap({streak: 6, northStar: 998, listeningLevel: 33});
    const after = snap({streak: 7, northStar: 1002, listeningLevel: 35});
    const all = detectMilestones(before, after);
    expect(all.length).toBeGreaterThan(1);
    expect(primaryMilestone(all)?.kind).toBe('levelUp');
  });

  it('returns null when nothing crossed', () => {
    expect(primaryMilestone([])).toBeNull();
  });
});
