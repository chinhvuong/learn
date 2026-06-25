import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {RootStackScreenProps} from '@/navigation/types.ts';
import {
  countAbsorbed,
  selectNorthStarLive,
} from '@/features/lesson/lessonSessionSlice';
import {recordLessonCompletion} from '@/features/home';
import {
  detectMilestones,
  primaryMilestone,
  selectQuickReview,
  type GamificationSnapshot,
  type Milestone,
} from '@/features/gamification';
import {
  GOLDEN_FIRST_LESSON,
  GOLDEN_FIRST_LESSON_QUIZ,
  NEXT_LESSON_DISCOVERY,
  PRE_ABSORBED_ITEMS,
} from '@/features/lesson/goldenFirstLesson';
import {GOLDEN_AUDIO_LESSON} from '@/features/lesson/goldenAudioLesson';
import {
  learnerFromHome,
  nextLesson,
  RECOMMENDATION_CATALOG,
  refreshRecommendation,
} from '@/features/home';
import type {RecommendedNextLesson} from '@/features/lesson/components/LessonCompleteView';
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
  const navigation = useNavigation<Props['navigation']>();
  const dispatch = useAppDispatch();
  const {t} = useTranslation();
  const {lessonId, onboarding, audioKind} = route.params ?? {};

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
  const home = useAppSelector(state => state.home);
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

  // On reaching completion, fold this Completed Lesson into the gamification
  // layer exactly once: advance the North Star / Daily Goal / Streak / Level and
  // capture which major milestone (if any) fired, for the Celebration entry.
  const recorded = useRef(false);
  const [completionMilestone, setCompletionMilestone] = useState<Milestone | null>(null);
  const [goalMet, setGoalMet] = useState(false);
  useEffect(() => {
    if (phase !== 'complete' || recorded.current) {
      return;
    }
    recorded.current = true;
    // Onboarding's Golden First Lesson runs *before* signup: its result is
    // committed as anonymous progress by the onboarding flow (the Reading Level
    // screen's return handler → Result), not folded into the account's Home
    // gamification here. So skip the core-loop recording and hand back to the
    // Onboarding stack, which resumes Result → Signup → Push → Main.
    if (onboarding) {
      navigation.goBack();
      return;
    }
    const absorbed = countAbsorbed(session);
    const byType = {
      vocabulary: lesson.items.filter(
        i => i.type === 'vocabulary' && session.decided[i.id] === 'absorbed',
      ).length,
      chunk: lesson.items.filter(
        i => i.type === 'chunk' && session.decided[i.id] === 'absorbed',
      ).length,
      grammarPoint: lesson.items.filter(
        i => i.type === 'grammarPoint' && session.decided[i.id] === 'absorbed',
      ).length,
    };
    const skill: 'reading' | 'listening' = isAudioLesson ? 'listening' : 'reading';

    // Snapshot before/after so we can detect any milestone crossed here. The
    // store mutation happens in the reducer; we re-derive the milestone from the
    // same before-state + the projected after-state for the Celebration entry.
    const before: GamificationSnapshot = {
      northStar: home.northStar,
      streak: home.streak,
      readingLevel: home.readingLevel,
      listeningLevel: home.listeningLevel,
    };
    dispatch(
      recordLessonCompletion({
        absorbed,
        absorbedByType: byType,
        minutes: 4,
        skill,
      }),
    );
    // Project the after-state the reducer produces (level +2, streak +1 if the
    // goal flips to met today) to choose the Celebration to offer.
    const projectedAfter: GamificationSnapshot = {
      northStar: before.northStar + absorbed,
      streak: before.streak, // streak only moves on the day-boundary logic
      readingLevel: skill === 'reading' ? before.readingLevel + 2 : before.readingLevel,
      listeningLevel: skill === 'listening' ? before.listeningLevel + 2 : before.listeningLevel,
    };
    const fired = primaryMilestone(detectMilestones(before, projectedAfter));
    setCompletionMilestone(fired);
    setGoalMet(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const close = () => navigation.goBack();

  // The Next Lesson recommendation for the Completion recap: run the engine
  // (`nextLesson`, issue #13) against the catalog for the current learner,
  // excluding the Lesson just completed, and format the Top-pick card's meta
  // ("5 phút · Công nghệ · B1") from the result (CONTEXT.md → "Recommendation
  // Reason" — the card always carries a Reason + match %).
  const recommended = useMemo<RecommendedNextLesson | null>(() => {
    const reco = nextLesson(
      learnerFromHome(home),
      RECOMMENDATION_CATALOG,
      lesson.id,
    );
    if (!reco) {
      return null;
    }
    const topic = reco.tags.find(tag => tag.axis === 'topic')?.value;
    const meta = t('HOME_LESSON_MINUTES', {
      count: reco.lesson.estimatedMinutes,
    }).concat(topic ? ` · ${topic}` : '', ` · ${reco.cefr}`);
    return {
      lessonId: reco.lesson.lessonId,
      title: reco.lesson.title,
      meta,
      reason: reco.reason,
      matchPct: reco.matchPct,
    };
  }, [home, lesson.id, t]);

  // One-tap Continue opens the recommended (preloaded) Next Lesson, refreshes
  // Home's recommendation for next time, and replaces this Player so Back does
  // not return to the finished Lesson.
  const continueToRecommended = () => {
    dispatch(refreshRecommendation({justCompleted: lesson.id}));
    if (recommended && 'push' in navigation) {
      // `push` mounts a fresh Player instance for the recommended Lesson so its
      // phase machine restarts (vs. `navigate`, which would only swap params).
      (navigation as {push: (n: string, p: object) => void}).push(
        'LessonPlayer',
        {lessonId: recommended.lessonId},
      );
    } else {
      close();
    }
  };

  // Open the full-screen Celebration for the milestone that fired this
  // completion (tier 2; reached from the completion screen's milestone entry).
  const openCelebration = () => {
    if (completionMilestone) {
      navigation.navigate('Celebration', {milestone: completionMilestone});
    }
  };

  // Open the optional 60-second quick review (light SRS) over the Items just
  // Absorbed this session — opt-in, never a due-queue. Empty selection still
  // opens (the view shows its no-debt empty state), so the exit is consistent.
  const openQuickReview = () => {
    const absorbedItems = lesson.items.filter(
      item => session.decided[item.id] === 'absorbed',
    );
    navigation.navigate('QuickReview', {
      prompts: selectQuickReview(absorbedItems),
    });
  };

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
          variant={audioKind}
          onClose={close}
          onCompleted={() => setPhase('quiz')}
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
          skill={isAudioLesson ? 'listening' : 'reading'}
          skillLevel={lesson.cefr}
          skillLevelNext="B2"
          northStarBase={northStarBase}
          northStarLive={northStarLive}
          recommended={recommended}
          streak={home.streak}
          goalMet={goalMet}
          hasMilestone={completionMilestone !== null}
          discovery={NEXT_LESSON_DISCOVERY}
          onContinue={continueToRecommended}
          onOpenDiscovery={close}
          onCelebrate={openCelebration}
          onQuickReview={openQuickReview}
          onShare={close}
          onRest={close}
        />
      )}
    </View>
  );
}
