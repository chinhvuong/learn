import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {HomeView} from '@/features/home';
import type {HomeLessonRef} from '@/features/home';
import {RootStackScreenProps} from '@/navigation/types.ts';

type Nav = RootStackScreenProps<'Main'>['navigation'];

/**
 * Học (Home) tab — the root screen on every launch (screens.md §8).
 *
 * The tab screen is thin: it renders the Home feature view and owns routing.
 * Continue re-enters the learning flow by opening the modal Lesson Player with
 * the resolved Lesson (the in-progress Lesson if any, else the recommendation),
 * so the whole navigation graph stays walkable.
 */
export default function LearnScreen() {
  const navigation = useNavigation<Nav>();

  const openLesson = (lesson: HomeLessonRef) => {
    navigation.navigate('LessonPlayer', {lessonId: lesson.lessonId});
  };

  return <HomeView onContinue={openLesson} onOpenRecommended={openLesson} />;
}
