/**
 * Lesson Player feature — Reading (Bilingual Passage, absorption gesture,
 * North Star). Public surface of the feature.
 */

export * from './types';
export {
  GOLDEN_FIRST_LESSON,
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
export {default as LessonListeningPlayer} from './components/LessonListeningPlayer';
export {default as LessonCompleteView} from './components/LessonCompleteView';
export {default as BilingualPassageView} from './components/BilingualPassageView';
export {default as ItemMeaningCard} from './components/ItemMeaningCard';
export {default as NorthStarCounter} from './components/NorthStarCounter';
