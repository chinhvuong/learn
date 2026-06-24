/**
 * Lesson Player feature — Reading (Bilingual Passage, absorption gesture,
 * North Star). Public surface of the feature.
 */

export * from './types';
export {
  GOLDEN_FIRST_LESSON,
  GOLDEN_FIRST_LESSON_QUIZ,
  NEXT_LESSON_DISCOVERY,
  PRE_ABSORBED_ITEMS,
  PRE_ABSORBED_ITEM_IDS,
} from './goldenFirstLesson';
export {
  isAnswered,
  selectAnswer,
  countAnswered,
  quizProgressPct,
  isCorrect,
  quizScore,
  isQuizComplete,
} from './quizLogic';
export type {QuizAnswers} from './quizLogic';
export {
  default as lessonSessionReducer,
  startSession,
  tapItem,
  closeCard,
  toggleSentenceTranslation,
  toggleAllSentenceTranslations,
  markRestKnown,
  completeSession,
  countDecided,
  countAbsorbed,
  countRemaining,
  isAllDecided,
  selectNorthStarLive,
  initialLessonSessionState,
} from './lessonSessionSlice';
export type {ItemDecision, LessonSessionState} from './lessonSessionSlice';
export {default as LessonReadingPlayer} from './components/LessonReadingPlayer';
export {default as LessonComprehensionQuiz} from './components/LessonComprehensionQuiz';
export {default as LessonCompleteView} from './components/LessonCompleteView';
export type {
  LessonSkill,
  DiscoverySuggestion,
} from './components/LessonCompleteView';
export {default as BilingualPassageView} from './components/BilingualPassageView';
export {default as ItemMeaningCard} from './components/ItemMeaningCard';
export {default as NorthStarCounter} from './components/NorthStarCounter';
