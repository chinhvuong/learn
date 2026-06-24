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
  selectContinueLesson,
  selectDailyGoalPercent,
  selectIsResuming,
  setInProgressLesson,
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
