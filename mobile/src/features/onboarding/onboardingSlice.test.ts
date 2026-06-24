/**
 * Behavior tests over the onboarding reducer — the value-before-signup gating
 * and the anonymous→account migration (PRD stories 1–11, screens.md
 * "ONBOARDING").
 *
 * These assert the rules called out in the issue's acceptance criteria:
 *   - the topic picker gate (≥3 selections seeds the Interest Profile);
 *   - the Reading Level self-select, including the "let the app decide" option;
 *   - the Listening Level is never asked — it is seeded as Reading − 1 band;
 *   - the Golden First Lesson result is captured as anonymous progress;
 *   - signup migrates that anonymous progress into the account (North Star is
 *     folded in, nothing is lost) and flips the learner off anonymous;
 *   - notification permission is recorded (asked only after signup, in the UI).
 */

import reducer, {
  commitGoldenLessonProgress,
  initialOnboardingState,
  migrateAnonymousProgressToAccount,
  selectHasEnoughTopics,
  setDailyGoal,
  setNotificationPermission,
  setReadingLevel,
  toggleTopic,
} from './onboardingSlice';
import {MIN_TOPICS, seedListeningBand} from '@/config/onboarding';

describe('onboarding — topic picker (Interest Profile seed)', () => {
  it('toggles topics in and out', () => {
    let state = reducer(initialOnboardingState, toggleTopic('tech'));
    state = reducer(state, toggleTopic('travel'));
    expect(state.selectedTopicIds).toEqual(['tech', 'travel']);
    state = reducer(state, toggleTopic('tech'));
    expect(state.selectedTopicIds).toEqual(['travel']);
  });

  it('enforces the ≥3 gate', () => {
    let state = reducer(initialOnboardingState, toggleTopic('tech'));
    state = reducer(state, toggleTopic('travel'));
    expect(selectHasEnoughTopics(state, MIN_TOPICS)).toBe(false);
    state = reducer(state, toggleTopic('science'));
    expect(selectHasEnoughTopics(state, MIN_TOPICS)).toBe(true);
  });
});

describe('onboarding — Reading Level + seeded Listening Level', () => {
  it('seeds Listening one band below the chosen Reading Level', () => {
    const state = reducer(
      initialOnboardingState,
      setReadingLevel({band: 'B1', source: 'self-select'}),
    );
    expect(state.readingLevel).toBe('B1');
    expect(state.listeningLevel).toBe('A2');
    expect(state.listeningLevel).toBe(seedListeningBand('B1'));
  });

  it('never seeds Listening below A1', () => {
    const state = reducer(
      initialOnboardingState,
      setReadingLevel({band: 'A1', source: 'self-select'}),
    );
    expect(state.listeningLevel).toBe('A1');
  });

  it('supports the "let the app decide" option (no band, no Listening seed)', () => {
    const state = reducer(
      initialOnboardingState,
      setReadingLevel({band: null, source: 'app-decide'}),
    );
    expect(state.readingLevel).toBeNull();
    expect(state.listeningLevel).toBeNull();
    expect(state.readingLevelSource).toBe('app-decide');
  });
});

describe('onboarding — Daily Goal', () => {
  it('records the chosen preset', () => {
    const state = reducer(initialOnboardingState, setDailyGoal(20));
    expect(state.dailyGoalMinutes).toBe(20);
  });
});

describe('onboarding — anonymous progress → account migration', () => {
  it('captures the Golden First Lesson result as anonymous progress', () => {
    const state = reducer(
      initialOnboardingState,
      commitGoldenLessonProgress({
        absorbedTotal: 8,
        breakdown: {vocabulary: 5, chunk: 2, grammarPoint: 1},
      }),
    );
    expect(state.anonymousProgress.absorbedTotal).toBe(8);
    expect(state.anonymousProgress.goldenLessonCompleted).toBe(true);
    expect(state.anonymousProgress.breakdown).toEqual({
      vocabulary: 5,
      chunk: 2,
      grammarPoint: 1,
    });
    // Still anonymous until signup.
    expect(state.isAnonymous).toBe(true);
    expect(state.accountNorthStar).toBe(0);
  });

  it('migrates the anonymous North Star into the account on signup', () => {
    let state = reducer(
      initialOnboardingState,
      commitGoldenLessonProgress({
        absorbedTotal: 8,
        breakdown: {vocabulary: 5, chunk: 2, grammarPoint: 1},
      }),
    );
    state = reducer(state, migrateAnonymousProgressToAccount({provider: 'apple'}));
    expect(state.isAnonymous).toBe(false);
    expect(state.authProvider).toBe('apple');
    // The 8 Items Absorbed pre-signup are folded into the account total.
    expect(state.accountNorthStar).toBe(8);
  });
});

describe('onboarding — notification priming (after signup)', () => {
  it('records the permission outcome', () => {
    const granted = reducer(initialOnboardingState, setNotificationPermission('granted'));
    expect(granted.notificationPermission).toBe('granted');
    const denied = reducer(initialOnboardingState, setNotificationPermission('denied'));
    expect(denied.notificationPermission).toBe('denied');
  });
});
