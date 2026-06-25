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
export {GOLDEN_AUDIO_LESSON} from './goldenAudioLesson';
export {
  useListeningReplayAudio,
  createMockAudioClock,
  SLOW_RATE,
  NORMAL_RATE,
} from './useListeningReplayAudio';
export type {
  LessonAudioClock,
  ListeningReplayAudio,
} from './useListeningReplayAudio';
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
export {
  SECTION10_LESSON,
  SECTION10_LESSON_ID,
  SECTION10_ITEMS,
  SECTION10_ITEMS_BY_ID,
  SECTION10_WARMUP_GROUPS,
  SECTION10_WARMUP_ORDER,
  SECTION10_COVERS,
  SECTION10_COVER_TITLES,
  SECTION10_READING_PAGES,
  SECTION10_PAGE_COUNT,
} from './lessonPlayerSection10';
export {default as LessonLoadingView} from './components/LessonLoadingView';
export {default as LessonCoreIntroPlayer} from './components/LessonCoreIntroPlayer';
export {default as LessonCoverScreen} from './components/LessonCoverScreen';
export {default as LessonWarmupPlayer} from './components/LessonWarmupPlayer';
export {default as LessonReadingImmersion} from './components/LessonReadingImmersion';
export {default as LessonReadingPlayer} from './components/LessonReadingPlayer';
export {default as LessonListeningPlayer} from './components/LessonListeningPlayer';
export {default as LessonComprehensionQuiz} from './components/LessonComprehensionQuiz';
export {default as LessonCompleteView} from './components/LessonCompleteView';
export type {
  LessonSkill,
  DiscoverySuggestion,
} from './components/LessonCompleteView';
export {default as BilingualPassageView} from './components/BilingualPassageView';
export {default as ItemMeaningCard} from './components/ItemMeaningCard';
export {default as NorthStarCounter} from './components/NorthStarCounter';
export {
  coreIntroOrder,
  coreKindCounts,
  clampCoreIndex,
  isFirstCore,
  isLastCore,
} from './coreIntro';
