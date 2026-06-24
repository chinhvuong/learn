import React, {useState} from 'react';
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
import LessonReadingPlayer from '@/features/lesson/components/LessonReadingPlayer';
import LessonComprehensionQuiz from '@/features/lesson/components/LessonComprehensionQuiz';
import LessonCompleteView from '@/features/lesson/components/LessonCompleteView';

type Props = RootStackScreenProps<'LessonPlayer'>;

/**
 * Lesson Player — presented as a full-screen modal stack over the tabs
 * (issue #4). This slice implements the Reading Practice Mode (screens.md §9):
 * the Bilingual Passage, the absorption gesture, and the North Star count-up,
 * running against the bundled Golden First Lesson (no backend dependency).
 *
 * Its `phase` state machine threads the closing steps of the Lesson:
 *   reading → quiz (comprehension) → complete (recap).
 * Listening Replay (§10) and the full recommendation surface layer on later.
 */
export default function LessonPlayerScreen({route}: Props) {
  const navigation = useNavigation();
  const {lessonId} = route.params ?? {};

  // Only the bundled Golden First Lesson exists today; a real lookup by
  // `lessonId` arrives with the lesson API.
  const lesson = GOLDEN_FIRST_LESSON;

  // Seed the North Star from a demo cumulative total (the handoff starts at
  // 1228 and counts up as Items are Absorbed). Home will own this later.
  const northStarBase = 1228;

  const [phase, setPhase] = useState<'reading' | 'quiz' | 'complete'>('reading');
  const session = useAppSelector(state => state.lessonSession);
  const northStarLive =
    session.lessonId === lesson.id
      ? selectNorthStarLive(session)
      : northStarBase;

  const close = () => navigation.goBack();

  return (
    <View className="flex-1 bg-background" testID={lessonId ? `lesson-${lessonId}` : undefined}>
      {phase === 'reading' ? (
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
