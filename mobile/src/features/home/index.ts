/**
 * Home (Học) feature — the learner's habit-centric re-entry point (screens.md
 * §8). Public surface of the feature.
 */

export {scoreToCefr} from './cefr';
export type {CefrBand} from './cefr';
export {
  default as homeReducer,
  setInProgressLesson,
  clearInProgressLesson,
  setRecommendedLesson,
  setDailyGoal,
  selectContinueLesson,
  selectIsResuming,
  selectDailyGoalPercent,
} from './homeSlice';
export type {HomeState, HomeLessonRef, DailyGoalUnit} from './homeSlice';
export {default as HomeView} from './components/HomeView';
