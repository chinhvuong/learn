/**
 * Behavior tests over the Home reducer and its selectors — the Continue /
 * resume contract and the Level → CEFR display (issue #10 acceptance criteria;
 * PRD stories 12–15).
 *
 * These assert:
 *   - Continue resolves to the in-progress Lesson when one exists, and falls
 *     back to the recommendation only when nothing is in progress;
 *   - clearing the in-progress Lesson flips Home to the recommendation;
 *   - the two Levels (Reading / Listening) map to CEFR independently;
 *   - Daily Goal progress is reported as a clamped 0–100 percentage.
 */

import reducer, {
  clearInProgressLesson,
  refreshRecommendation,
  recordLessonCompletion,
  selectContinueLesson,
  selectDailyGoalPercent,
  selectIsResuming,
  setInProgressLesson,
  setLevelScore,
  setRecommendedLesson,
  type HomeLessonRef,
  type HomeState,
} from './homeSlice';
import {scoreToCefr} from './cefr';

const REC: HomeLessonRef = {
  lessonId: 'rec-lesson',
  title: 'A Recommended Lesson',
  estimatedMinutes: 6,
};
/** The new `setRecommendedLesson` payload carries the Reason + match % too. */
const setRec = (lesson: HomeLessonRef) =>
  setRecommendedLesson({lesson, reason: 'vì lý do nào đó', matchPct: 90});
const IN_PROGRESS: HomeLessonRef = {
  lessonId: 'in-progress-lesson',
  title: 'An Unfinished Lesson',
  estimatedMinutes: 4,
};

const baseState = (): HomeState =>
  reducer(undefined, {type: '@@INIT'} as never);

describe('homeSlice — Continue / resume', () => {
  it('Continue resumes the in-progress Lesson when one exists', () => {
    let state = baseState();
    state = reducer(state, setRec(REC));
    state = reducer(state, setInProgressLesson(IN_PROGRESS));

    expect(selectIsResuming(state)).toBe(true);
    expect(selectContinueLesson(state)?.lessonId).toBe(IN_PROGRESS.lessonId);
  });

  it('Continue recommends a new Lesson only when nothing is in progress', () => {
    let state = baseState();
    state = reducer(state, setRec(REC));
    state = reducer(state, clearInProgressLesson());

    expect(selectIsResuming(state)).toBe(false);
    expect(selectContinueLesson(state)?.lessonId).toBe(REC.lessonId);
  });

  it('clearing the in-progress Lesson flips Continue to the recommendation', () => {
    let state = baseState();
    state = reducer(state, setRec(REC));
    state = reducer(state, setInProgressLesson(IN_PROGRESS));
    expect(selectContinueLesson(state)?.lessonId).toBe(IN_PROGRESS.lessonId);

    state = reducer(state, clearInProgressLesson());
    expect(selectContinueLesson(state)?.lessonId).toBe(REC.lessonId);
  });

  it('Continue is null only when nothing is in progress and nothing recommended', () => {
    let state = baseState();
    state = reducer(state, clearInProgressLesson());
    state = reducer(state, setRecommendedLesson(null));
    expect(selectContinueLesson(state)).toBeNull();
  });
});

describe('homeSlice — recommendation (Home Continue fallback)', () => {
  it('seeds an engine-derived recommendation with a Reason + match %', () => {
    const state = baseState();
    // Home's Continue falls back to this when nothing is in progress.
    expect(state.recommendedLesson).not.toBeNull();
    expect(state.recommendedReason).toBeTruthy();
    expect(state.recommendedMatchPct).toBeGreaterThanOrEqual(0);
    expect(state.recommendedMatchPct).toBeLessThanOrEqual(100);
  });

  it('refreshRecommendation re-runs the engine and excludes the just-completed Lesson', () => {
    let state = baseState();
    const completed = state.recommendedLesson?.lessonId;
    state = reducer(
      state,
      refreshRecommendation({justCompleted: completed}),
    );
    expect(state.recommendedLesson?.lessonId).not.toBe(completed);
    expect(state.recommendedReason).toBeTruthy();
    expect(state.recommendedMatchPct).not.toBeNull();
  });

  it('setRecommendedLesson(null) clears the recommendation Reason + %', () => {
    let state = baseState();
    state = reducer(state, setRecommendedLesson(null));
    expect(state.recommendedLesson).toBeNull();
    expect(state.recommendedReason).toBeNull();
    expect(state.recommendedMatchPct).toBeNull();
  });
});

describe('homeSlice — Daily Goal percent', () => {
  it('reports progress as a clamped 0–100 percentage', () => {
    const state = baseState();
    // Seeded 6/10 minutes → 60%.
    expect(selectDailyGoalPercent(state)).toBe(60);
  });
});

describe('Levels → CEFR (independent reading / listening)', () => {
  it('maps fine 0–100 scores to CEFR bands', () => {
    expect(scoreToCefr(0)).toBe('A1');
    expect(scoreToCefr(24)).toBe('A2');
    expect(scoreToCefr(40)).toBe('B1');
    expect(scoreToCefr(55)).toBe('B2');
    expect(scoreToCefr(70)).toBe('C1');
    expect(scoreToCefr(100)).toBe('C2');
  });

  it('lets Reading outpace Listening (mapped independently)', () => {
    const state = baseState();
    expect(scoreToCefr(state.readingLevel)).toBe('B1');
    expect(scoreToCefr(state.listeningLevel)).toBe('A2');
  });
});

describe('recordLessonCompletion — real learning advances the gamification layer', () => {
  it('increments the North Star by the Items Absorbed this session', () => {
    let state = baseState();
    const before = state.northStar;
    state = reducer(
      state,
      recordLessonCompletion({absorbed: 12, minutes: 4, skill: 'reading', day: '2026-06-24'}),
    );
    expect(state.northStar).toBe(before + 12);
  });

  it('extends the Streak when the goal is met the day after the last one', () => {
    // Seed yesterday as the last qualifying day so today continues the run.
    // Seeded goal is 10 minutes, 6 already done → +4 min meets it.
    let state: HomeState = {
      ...baseState(),
      streak: 12,
      lastGoalMetDay: '2026-06-23',
    };
    state = reducer(
      state,
      recordLessonCompletion({absorbed: 5, minutes: 4, skill: 'reading', day: '2026-06-24'}),
    );
    expect(state.dailyGoalProgress).toBe(10);
    // Streak extends because the goal flipped to met today (consecutive day).
    expect(state.streak).toBe(13);
    expect(state.lastGoalMetDay).toBe('2026-06-24');
  });

  it('opens the Streak at 1 when the goal is first met with no prior day', () => {
    // Seeded lastGoalMetDay is null → the first qualifying day restarts at 1.
    let state = baseState();
    state = reducer(
      state,
      recordLessonCompletion({absorbed: 5, minutes: 4, skill: 'reading', day: '2026-06-24'}),
    );
    expect(state.streak).toBe(1);
    expect(state.lastGoalMetDay).toBe('2026-06-24');
  });

  it('does not advance the Streak when the Daily Goal is not yet met', () => {
    let state = baseState();
    const streakBefore = state.streak;
    state = reducer(
      state,
      recordLessonCompletion({absorbed: 2, minutes: 1, skill: 'reading', day: '2026-06-24'}),
    );
    expect(state.dailyGoalProgress).toBe(7); // 6 + 1, below 10
    expect(state.streak).toBe(streakBefore);
  });

  it('clears the in-progress Lesson on completion', () => {
    let state = baseState();
    expect(state.inProgressLesson).not.toBeNull();
    state = reducer(
      state,
      recordLessonCompletion({absorbed: 3, minutes: 4, skill: 'reading', day: '2026-06-24'}),
    );
    expect(state.inProgressLesson).toBeNull();
  });

  it('appends a Level-up milestone to the trophy case when a band is crossed', () => {
    // Seed Listening at 33 (A2, one below the B1 boundary at 34) so +2 crosses.
    let state: HomeState = {...baseState(), listeningLevel: 33};
    const before = state.earnedMilestones.length;
    state = reducer(
      state,
      recordLessonCompletion({
        absorbed: 1,
        minutes: 4,
        skill: 'listening',
        levelGain: 2,
        day: '2026-06-24',
      }),
    );
    expect(scoreToCefr(state.listeningLevel)).toBe('B1');
    const added = state.earnedMilestones.slice(before);
    expect(added).toContainEqual({
      kind: 'levelUp',
      skill: 'listening',
      fromBand: 'A2',
      toBand: 'B1',
    });
  });
});

describe('setLevelScore — Level-up moment from behavior (no test)', () => {
  it('records a Level-up milestone when the new score crosses a band', () => {
    let state: HomeState = {...baseState(), readingLevel: 49}; // B1, boundary B2=50
    const before = state.earnedMilestones.length;
    state = reducer(state, setLevelScore({skill: 'reading', score: 51}));
    expect(scoreToCefr(state.readingLevel)).toBe('B2');
    expect(state.earnedMilestones.slice(before)).toContainEqual({
      kind: 'levelUp',
      skill: 'reading',
      fromBand: 'B1',
      toBand: 'B2',
    });
  });

  it('records nothing when the score stays within the band', () => {
    let state: HomeState = {...baseState(), readingLevel: 40};
    const before = state.earnedMilestones.length;
    state = reducer(state, setLevelScore({skill: 'reading', score: 45}));
    expect(state.earnedMilestones).toHaveLength(before);
  });
});
