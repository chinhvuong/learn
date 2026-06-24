import React, {useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppSelector} from '@/store/hooks';
import {RootStackScreenProps} from '@/navigation/types.ts';
import {selectNorthStarLive} from '@/features/lesson/lessonSessionSlice';
import {
  GOLDEN_FIRST_LESSON,
  PRE_ABSORBED_ITEMS,
} from '@/features/lesson/goldenFirstLesson';
import {GOLDEN_AUDIO_LESSON} from '@/features/lesson/goldenAudioLesson';
import LessonReadingPlayer from '@/features/lesson/components/LessonReadingPlayer';
import LessonListeningPlayer from '@/features/lesson/components/LessonListeningPlayer';
import LessonCompleteView from '@/features/lesson/components/LessonCompleteView';

type Props = RootStackScreenProps<'LessonPlayer'>;

/**
 * Lesson Player — presented as a full-screen modal stack over the tabs
 * (issue #4). This slice implements the Reading Practice Mode (screens.md §9):
 * the Bilingual Passage, the absorption gesture, and the North Star count-up,
 * plus the Listening Replay Practice Mode (§10) for audio Sources — selected by
 * Source type (presence of `lesson.audio`). Runs against bundled Lessons (no
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

  const [phase, setPhase] = useState<'reading' | 'complete'>('reading');
  const session = useAppSelector(state => state.lessonSession);
  const northStarLive =
    session.lessonId === lesson.id
      ? selectNorthStarLive(session)
      : northStarBase;

  const close = () => navigation.goBack();

  return (
    <View className="flex-1 bg-background" testID={lessonId ? `lesson-${lessonId}` : undefined}>
      {phase === 'reading' && isAudioLesson ? (
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
          onCompleted={() => setPhase('complete')}
        />
      ) : (
        <LessonCompleteView
          items={lesson.items}
          decided={session.decided}
          northStarBase={northStarBase}
          northStarLive={northStarLive}
          onContinue={close}
        />
      )}
    </View>
  );
}
