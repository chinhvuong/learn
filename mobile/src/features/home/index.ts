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
  refreshRecommendation,
  setRecommendedLesson,
  setDailyGoal,
  selectContinueLesson,
  selectIsResuming,
  selectDailyGoalPercent,
} from './homeSlice';
export type {HomeState, HomeLessonRef, DailyGoalUnit} from './homeSlice';
export {nextLesson} from './recommendation';
export type {
  Recommendation,
  RecoLearner,
  RecoSource,
  RecoSkill,
  CatalogLesson,
  RecoSignalTag,
} from './recommendation';
export {
  RECOMMENDATION_CATALOG,
  learnerFromHome,
  CURRENT_SERIES_ID,
  CURRENT_SERIES_NAME,
} from './recommendationCatalog';
export {default as HomeView} from './components/HomeView';
