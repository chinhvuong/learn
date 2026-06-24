/**
 * Onboarding reducer — the persisted state for the value-before-signup first
 * run (screens.md "ONBOARDING", PRD stories 1–11).
 *
 * It holds everything the onboarding flow accumulates *before* an account
 * exists, then migrates that anonymous progress into the account on signup:
 *
 *   - the **Interest Profile** seed (chosen topic ids — cold start),
 *   - the self-selected **Reading Level** and the seeded **Listening Level**
 *     (Reading − 1 band; never asked separately — CONTEXT.md "Level"),
 *   - the learner's **Daily Goal** (minutes/day),
 *   - the **anonymous progress** from the Golden First Lesson — the North Star
 *     gain and the by-type Absorbed breakdown — kept until signup,
 *   - the account / notification-permission flags that gate the later steps.
 *
 * The anonymous→account migration (PRD story 10) is real against this store:
 * `migrateAnonymousProgressToAccount` folds the anonymous North Star into the
 * account's cumulative total so nothing the learner just did is lost.
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {CefrBand} from '@/config/onboarding';
import {DEFAULT_DAILY_GOAL_MINUTES, seedListeningBand} from '@/config/onboarding';

/** How the learner arrived at their Reading Level. */
export type ReadingLevelSource = 'self-select' | 'app-decide';

/** The by-type Absorbed breakdown for the session recap (North Star jump). */
export interface AbsorbedBreakdown {
  vocabulary: number;
  chunk: number;
  grammarPoint: number;
}

/** A snapshot of the anonymous Golden First Lesson result, pending migration. */
export interface AnonymousProgress {
  /** Items Absorbed in the Golden First Lesson (drives the North Star +N). */
  absorbedTotal: number;
  /** By-type split for the recap card. */
  breakdown: AbsorbedBreakdown;
  /** Whether the learner has completed the Golden First Lesson. */
  goldenLessonCompleted: boolean;
}

export type NotificationPermission = 'undetermined' | 'granted' | 'denied';

export interface OnboardingState {
  /** Whether the learner has finished the whole onboarding flow. */
  completed: boolean;
  /** Interest Profile seed — chosen topic ids (≥3 to advance). */
  selectedTopicIds: string[];
  /**
   * Self-selected Reading Level (null when the learner picked "let the app
   * figure it out" — the app probes over the first Lessons).
   */
  readingLevel: CefrBand | null;
  /** How the Reading Level was determined. */
  readingLevelSource: ReadingLevelSource;
  /**
   * Listening Level, seeded as Reading − 1 band (never asked at onboarding;
   * self-corrects later). Null when the Reading Level is "let the app decide".
   */
  listeningLevel: CefrBand | null;
  /** Daily Goal target in minutes/day (defines the Streak). */
  dailyGoalMinutes: number;
  /** Anonymous progress from the Golden First Lesson, pending migration. */
  anonymousProgress: AnonymousProgress;
  /** True until the learner signs up (delayed signup — PRD story 9). */
  isAnonymous: boolean;
  /** Auth provider used at signup (stubbed at the native boundary). */
  authProvider: 'apple' | 'google' | 'email' | null;
  /**
   * Cumulative North Star carried into the account after migration. Home/Profile
   * own the live North Star later; this is the migrated starting total.
   */
  accountNorthStar: number;
  /** Notification permission outcome (asked only after signup). */
  notificationPermission: NotificationPermission;
}

const emptyBreakdown: AbsorbedBreakdown = {vocabulary: 0, chunk: 0, grammarPoint: 0};

export const initialOnboardingState: OnboardingState = {
  completed: false,
  selectedTopicIds: [],
  readingLevel: null,
  readingLevelSource: 'self-select',
  listeningLevel: null,
  dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
  anonymousProgress: {
    absorbedTotal: 0,
    breakdown: {...emptyBreakdown},
    goldenLessonCompleted: false,
  },
  isAnonymous: true,
  authProvider: null,
  accountNorthStar: 0,
  notificationPermission: 'undetermined',
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: initialOnboardingState,
  reducers: {
    /** Toggle a topic in/out of the Interest Profile seed. */
    toggleTopic: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedTopicIds.includes(id)) {
        state.selectedTopicIds = state.selectedTopicIds.filter(t => t !== id);
      } else {
        state.selectedTopicIds.push(id);
      }
    },

    /**
     * Record the self-selected Reading Level and seed the Listening Level one
     * band below (CONTEXT.md). `null` band = "let the app figure it out".
     */
    setReadingLevel: (
      state,
      action: PayloadAction<{band: CefrBand | null; source: ReadingLevelSource}>,
    ) => {
      const {band, source} = action.payload;
      state.readingLevel = band;
      state.readingLevelSource = source;
      state.listeningLevel = band ? seedListeningBand(band) : null;
    },

    /** Set the chosen Daily Goal (minutes/day). */
    setDailyGoal: (state, action: PayloadAction<number>) => {
      state.dailyGoalMinutes = action.payload;
    },

    /**
     * Commit the Golden First Lesson result as anonymous progress (the aha
     * moment), read from the transient lesson session at completion.
     */
    commitGoldenLessonProgress: (
      state,
      action: PayloadAction<{absorbedTotal: number; breakdown: AbsorbedBreakdown}>,
    ) => {
      state.anonymousProgress = {
        absorbedTotal: action.payload.absorbedTotal,
        breakdown: action.payload.breakdown,
        goldenLessonCompleted: true,
      };
    },

    /**
     * Delayed signup (PRD story 9). Flips the learner from anonymous to an
     * account AND migrates the anonymous progress into it (PRD story 10): the
     * North Star Absorbed in the Golden First Lesson is folded into the
     * account's cumulative total so nothing the learner just did is lost.
     */
    migrateAnonymousProgressToAccount: (
      state,
      action: PayloadAction<{provider: 'apple' | 'google' | 'email'}>,
    ) => {
      state.authProvider = action.payload.provider;
      state.isAnonymous = false;
      state.accountNorthStar += state.anonymousProgress.absorbedTotal;
    },

    /** Record the notification permission outcome (asked only after signup). */
    setNotificationPermission: (
      state,
      action: PayloadAction<NotificationPermission>,
    ) => {
      state.notificationPermission = action.payload;
    },

    /** Mark the whole onboarding flow finished (hands off to Home). */
    finishOnboarding: state => {
      state.completed = true;
    },

    /** Reset onboarding (e.g. for a fresh first-run during development/tests). */
    resetOnboarding: () => initialOnboardingState,
  },
});

// --- Selectors ---

/** Whether the topic picker gate is satisfied (≥ minimum topics). */
export const selectHasEnoughTopics = (
  state: OnboardingState,
  min: number,
): boolean => state.selectedTopicIds.length >= min;

export const {
  toggleTopic,
  setReadingLevel,
  setDailyGoal,
  commitGoldenLessonProgress,
  migrateAnonymousProgressToAccount,
  setNotificationPermission,
  finishOnboarding,
  resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
