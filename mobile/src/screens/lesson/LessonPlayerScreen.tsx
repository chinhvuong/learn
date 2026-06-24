import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppSelector} from '@/store/hooks';
import {RootStackScreenProps} from '@/navigation/types.ts';
import {selectNorthStarLive} from '@/features/lesson/lessonSessionSlice';
import {
  GOLDEN_FIRST_LESSON,
  GOLDEN_FIRST_LESSON_QUIZ,
  NEXT_LESSON_DISCOVERY,
  PRE_ABSORBED_ITEMS,
} from '@/features/lesson/goldenFirstLesson';
import {GOLDEN_AUDIO_LESSON} from '@/features/lesson/goldenAudioLesson';
import LessonLoadingView from '@/features/lesson/components/LessonLoadingView';
import LessonCoreIntroPlayer from '@/features/lesson/components/LessonCoreIntroPlayer';
import LessonReadingPlayer from '@/features/lesson/components/LessonReadingPlayer';
import LessonListeningPlayer from '@/features/lesson/components/LessonListeningPlayer';
import LessonComprehensionQuiz from '@/features/lesson/components/LessonComprehensionQuiz';
import LessonCompleteView from '@/features/lesson/components/LessonCompleteView';

/** Simulated lesson-build delay before the core preview (handoff: ~1.5s). */
const LESSON_LOADING_MS = 1500;

type Props = RootStackScreenProps<'LessonPlayer'>;

/**
 * Lesson Player — presented as a full-screen modal stack over the tabs
 * (issue #4). Orchestrates the phase machine for one pass through a Lesson:
 *
 *   loading → core → reading → quiz → complete
 *
 * `loading` shows a spinner while the Lesson is prepared (screens.md §13/E4);
 * `core` introduces each new Item one at a time before the reading surface
 * (the flashcard preview of "Lõi chung"); `reading` is the Reading Practice
 * Mode (§9) — Bilingual Passage + absorption gesture + North Star — or, for
 * audio Sources (presence of `lesson.audio`), the Listening Replay Practice
 * Mode (§10) selected by Source type; `quiz` is the optional comprehension
 * check; `complete` is the session recap. Runs against bundled Lessons (no
 * backend dependency).
 */
export default function LessonPlayerScreen({route}: Props) {
  const navigation = useNavigation();
  const {lessonId} = route.params ?? {};

  // Only the two bundled Lessons exist today; a real lookup by `lessonId`
  // arrives with the lesson API. Route to the audio Lesson when asked for it.
  const lesson =
    lessonId === GOLDEN_AUDIO_LESSON.id ? GOLDEN_AUDIO_LESSON : GOLDEN_FIRST_LESSON;

  // The Practice Mode is chosen by Source type: audio Lessons get Listening
  // Replay, text Lessons get Reading. This does not change Reading behavior.
  const isAudioLesson = !!lesson.audio;

  // Seed the North Star from a demo cumulative total (the handoff starts at
  // 1228 and counts up as Items are Absorbed). Home will own this later.
  const northStarBase = 1228;

  const [phase, setPhase] = useState<
    'loading' | 'core' | 'reading' | 'quiz' | 'complete'
  >('loading');
  const session = useAppSelector(state => state.lessonSession);
  const northStarLive =
    session.lessonId === lesson.id
      ? selectNorthStarLive(session)
      : northStarBase;

  // The Lesson opens with a loading state (a pre-analyzed Lesson is prepared),
  // then advances to the core Item-intro after a short simulated build delay.
  useEffect(() => {
    if (phase !== 'loading') {
      return;
    }
    const timer = setTimeout(() => setPhase('core'), LESSON_LOADING_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const close = () => navigation.goBack();

  return (
    <View className="flex-1 bg-background" testID={lessonId ? `lesson-${lessonId}` : undefined}>
      {phase === 'loading' ? (
        <LessonLoadingView variant="loading" />
      ) : phase === 'core' ? (
        <LessonCoreIntroPlayer
          lesson={lesson}
          onClose={close}
          onStartReading={() => setPhase('reading')}
        />
      ) : phase === 'reading' && isAudioLesson ? (
        <LessonListeningPlayer
          lesson={lesson}
          northStarBase={northStarBase}
          onClose={close}
          onCompleted={() => setPhase('complete')}
        />
      ) : phase === 'reading' ? (
        <LessonReadingPlayer
          lesson={lesson}
          preAbsorbedItems={PRE_ABSORBED_ITEMS}
          northStarBase={northStarBase}
          onClose={close}
          onCompleted={() => setPhase('quiz')}
        />
      ) : phase === 'quiz' ? (
        <LessonComprehensionQuiz
          lessonTitle={lesson.title}
          questions={GOLDEN_FIRST_LESSON_QUIZ}
          onClose={close}
          onFinished={() => setPhase('complete')}
        />
      ) : (
        <LessonCompleteView
          items={lesson.items}
          decided={session.decided}
          minutesStudied={4}
          skill="reading"
          skillLevel={lesson.cefr}
          skillLevelNext="B2"
          northStarBase={northStarBase}
          northStarLive={northStarLive}
          discovery={NEXT_LESSON_DISCOVERY}
          onContinue={close}
          onOpenDiscovery={close}
        />
      )}
    </View>
  );
}
