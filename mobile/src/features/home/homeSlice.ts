/**
 * Home (Học) learner-state reducer — the persisted habit/progress layer the
 * Home screen reads on every launch (screens.md §8; PRD stories 12–15).
 *
 * Holds the cumulative **North Star** (Items Absorbed — the headline metric),
 * the self-set **Daily Goal** and today's progress, the **Streak**, and the two
 * separate **Levels** (Reading and Listening, stored as fine 0–100 scores,
 * shown as CEFR). It also holds a marker for the **in-progress Lesson** that
 * powers "Continue" — Home resumes an unfinished Lesson if one exists, and only
 * recommends a new one when nothing is in progress.
 *
 * This is per-learner state and IS persisted (whitelisted in the store), unlike
 * the transient `lessonSession` reducer which always opens a Lesson fresh.
 *
 * NOTE: today these fields carry seeded demo values so the vertical slice
 * renders against real state. Real wiring lands with their owning issues:
 *   - North Star / Daily Goal / Streak are advanced by the Lesson-complete flow.
 *   - Levels move from the too-easy/too-hard self-correction signal.
 *   - `inProgressLesson` is set when the learner pauses/exits a Lesson Player
 *     mid-pass (screens.md E3) and cleared on completion.
 *   - `recommendedLesson` is stubbed until the recommendation consumer slice
 *     (issue #3) provides the real Next Lesson recommendation.
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GOLDEN_FIRST_LESSON} from '@/features/lesson/goldenFirstLesson';
import {nextLesson} from './recommendation';
import {
  CURRENT_SERIES_ID,
  learnerFromHome,
  RECOMMENDATION_CATALOG,
} from './recommendationCatalog';

/** The Daily Goal can be measured in minutes of Input or in new Items. */
export type DailyGoalUnit = 'minutes' | 'items';

/**
 * A compact reference to a Lesson surfaced on Home — enough to render the
 * Continue / recommendation card and deep-link into the Lesson Player. It is
 * NOT the full Lesson (that lives in the lesson feature / API).
 */
export interface HomeLessonRef {
  /** Stable Lesson id passed to the Lesson Player route. */
  lessonId: string;
  /** English Source title shown in the card (chrome around it is Vietnamese). */
  title: string;
  /** Estimated length in minutes (e.g. the "4 phút" line). */
  estimatedMinutes: number;
  /** Series name this Lesson belongs to, if any (e.g. "Công nghệ B1"). */
  seriesName?: string;
  /** 1-based position of this Lesson within its Series. */
  seriesIndex?: number;
  /** Total Lessons in the Series. */
  seriesTotal?: number;
}

export interface HomeState {
  /** Cumulative count of Absorbed Items — the North Star (largest on Home). */
  northStar: number;
  /** Items Absorbed today (drives the "+N hôm nay" line). */
  absorbedToday: number;

  /** The self-set Daily Goal target (e.g. 10 minutes, or 5 new Items). */
  dailyGoalTarget: number;
  /** Whether the goal is measured in minutes of Input or new Items. */
  dailyGoalUnit: DailyGoalUnit;
  /** Progress toward today's Daily Goal, in the same unit. */
  dailyGoalProgress: number;

  /** Consecutive days the learner met their Daily Goal. */
  streak: number;

  /** Reading Level — fine 0–100 score; shown as CEFR. */
  readingLevel: number;
  /** Listening Level — fine 0–100 score; shown as CEFR. Often below Reading. */
  listeningLevel: number;

  /** The Series the learner is currently progressing through (tier A), if any. */
  currentSeriesId?: string;
  /** 1-based index of the LAST Lesson the learner finished in that Series. */
  currentSeriesPosition?: number;

  /**
   * The Lesson the learner left unfinished. `null` when nothing is in progress
   * — in which case Continue falls back to `recommendedLesson`.
   */
  inProgressLesson: HomeLessonRef | null;
  /**
   * The recommended Next Lesson, used when nothing is in progress — produced by
   * the recommendation engine (`nextLesson`, issue #13) and refreshed on launch
   * and on completion. `null` only when the catalog has nothing eligible.
   */
  recommendedLesson: HomeLessonRef | null;
  /**
   * The human-readable Recommendation Reason shown with `recommendedLesson`
   * (CONTEXT.md → "Recommendation Reason"), e.g. "vì bạn thích chủ đề Công nghệ".
   */
  recommendedReason: string | null;
  /** The recommendation's match % (CONTEXT.md), shown as "94%". */
  recommendedMatchPct: number | null;
}

/**
 * Seeded demo state. The values mirror the screens.md §8 wireframe
 * (North Star 1,240 · +18 today · 6/10' goal · 🔥12 · B1 đọc / A2 nghe) so the
 * slice renders against realistic data before the producing flows are wired.
 */
const initialState: HomeState = {
  northStar: 1240,
  absorbedToday: 18,

  dailyGoalTarget: 10,
  dailyGoalUnit: 'minutes',
  dailyGoalProgress: 6,

  streak: 12,

  // Reading commonly outpaces Listening — seed Reading at B1, Listening at A2.
  readingLevel: 40, // B1
  listeningLevel: 24, // A2

  // The learner is mid-way through their Starter Series (3 of 12 done) so tier A
  // can recommend the next-in-Series Lesson.
  currentSeriesId: CURRENT_SERIES_ID,
  currentSeriesPosition: 3,

  // Seed an in-progress Lesson so Continue resumes by default; clearing it
  // (clearInProgressLesson) falls Home back to the recommendation.
  inProgressLesson: {
    lessonId: GOLDEN_FIRST_LESSON.id,
    title: GOLDEN_FIRST_LESSON.title,
    estimatedMinutes: 4,
    seriesName: 'Công nghệ B1',
    seriesIndex: 3,
    seriesTotal: 12,
  },
  // Engine-derived recommendation (issue #13), so Home's Continue fallback and
  // the Discover entry show a real Reason + match % from the first launch.
  recommendedLesson: null,
  recommendedReason: null,
  recommendedMatchPct: null,
};

/**
 * Run the recommendation engine against the catalog for the current learner and
 * fold the result onto state (the recommended Lesson + its Reason + match %).
 * Used to seed the initial state and to refresh on launch / after completion.
 */
function applyRecommendation(state: HomeState, justCompleted?: string): void {
  const reco = nextLesson(
    learnerFromHome(state),
    RECOMMENDATION_CATALOG,
    justCompleted,
  );
  state.recommendedLesson = reco?.lesson ?? null;
  state.recommendedReason = reco?.reason ?? null;
  state.recommendedMatchPct = reco?.matchPct ?? null;
}

applyRecommendation(initialState);

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    /** Mark a Lesson as in progress (learner paused/exited mid-pass — E3). */
    setInProgressLesson: (state, action: PayloadAction<HomeLessonRef>) => {
      state.inProgressLesson = action.payload;
    },
    /** Clear the in-progress Lesson (e.g. on completion) → Continue recommends. */
    clearInProgressLesson: state => {
      state.inProgressLesson = null;
    },
    /**
     * Re-run the recommendation engine (`nextLesson`, issue #13) and store the
     * new Top pick + Reason + match %. Pass the just-completed Lesson id so the
     * completion handoff never re-recommends the Lesson the learner just did.
     */
    refreshRecommendation: (
      state,
      action: PayloadAction<{justCompleted?: string} | undefined>,
    ) => {
      applyRecommendation(state, action.payload?.justCompleted);
    },
    /**
     * Directly set the recommended Next Lesson + its Reason + match % (e.g. when
     * a consumer computed the recommendation itself). `null` clears it.
     */
    setRecommendedLesson: (
      state,
      action: PayloadAction<{
        lesson: HomeLessonRef;
        reason: string;
        matchPct: number;
      } | null>,
    ) => {
      state.recommendedLesson = action.payload?.lesson ?? null;
      state.recommendedReason = action.payload?.reason ?? null;
      state.recommendedMatchPct = action.payload?.matchPct ?? null;
    },
    /** Update the self-set Daily Goal (Settings, story 72). */
    setDailyGoal: (
      state,
      action: PayloadAction<{target: number; unit: DailyGoalUnit}>,
    ) => {
      state.dailyGoalTarget = action.payload.target;
      state.dailyGoalUnit = action.payload.unit;
    },
  },
});

// --- Selectors (pure; reused by the screen and tests) ---

/**
 * The Lesson "Continue" targets: the in-progress Lesson if one exists, else the
 * recommended Next Lesson (PRD story 13). `null` only if there is genuinely
 * nothing to start.
 */
export const selectContinueLesson = (state: HomeState): HomeLessonRef | null =>
  state.inProgressLesson ?? state.recommendedLesson;

/** Whether Continue is resuming an unfinished Lesson (vs. recommending a new one). */
export const selectIsResuming = (state: HomeState): boolean =>
  state.inProgressLesson !== null;

/** Daily Goal progress as a clamped 0–100 percentage (for the ProgressBar). */
export const selectDailyGoalPercent = (state: HomeState): number => {
  if (state.dailyGoalTarget <= 0) {
    return 0;
  }
  const pct = (state.dailyGoalProgress / state.dailyGoalTarget) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

export const {
  setInProgressLesson,
  clearInProgressLesson,
  refreshRecommendation,
  setRecommendedLesson,
  setDailyGoal,
} = homeSlice.actions;

export default homeSlice.reducer;
