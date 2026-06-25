import React, {useEffect} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {HomeView, refreshRecommendation} from '@/features/home';
import type {HomeLessonRef} from '@/features/home';
import {useAppDispatch} from '@/store/hooks';
import {RootStackScreenProps} from '@/navigation/types.ts';

type Nav = RootStackScreenProps<'Main'>['navigation'];

/**
 * Học (Home) tab — the root screen on every launch (screens.md §8).
 *
 * The tab screen is thin: it renders the Home feature view and owns routing.
 * Continue re-enters the learning flow by opening the modal Lesson Player with
 * the resolved Lesson (the in-progress Lesson if any, else the recommendation),
 * so the whole navigation graph stays walkable.
 *
 * On mount / focus it refreshes the Next Lesson recommendation (`nextLesson`,
 * issue #13) so the Continue fallback + Discover entry always carry a current
 * Recommendation Reason + match % — even after a relaunch that rehydrated a
 * pre-engine persisted state.
 */
export default function LearnScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(refreshRecommendation());
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(refreshRecommendation());
    }, [dispatch]),
  );

  const openLesson = (lesson: HomeLessonRef) => {
    navigation.navigate('LessonPlayer', {lessonId: lesson.lessonId});
  };

  return (
    <HomeView
      onContinue={openLesson}
      onOpenRecommended={openLesson}
      onOpenLibrary={() => navigation.navigate('MyLibrary')}
      onOpenSettings={() => navigation.navigate('Settings')}
    />
  );
}
