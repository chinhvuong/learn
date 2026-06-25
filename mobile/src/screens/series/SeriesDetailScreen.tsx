import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SeriesDetailView, findSeries, type SeriesLesson} from '@/features/series';
import {RootStackScreenProps} from '@/navigation/types';

type Props = RootStackScreenProps<'SeriesDetail'>;
type Nav = Props['navigation'];

/**
 * 17b Series — Detail (§05; design node `e4eYZ`). Resolves the Series by id and
 * renders its ordered Lessons; back returns to Browse, a Lesson opens the modal
 * Lesson Player (the core loop entry).
 */
export default function SeriesDetailScreen({route}: Props) {
  const navigation = useNavigation<Nav>();
  const series = findSeries(route.params.seriesId);

  if (!series) {
    return <View style={{flex: 1}} />;
  }

  const openLesson = (lesson: SeriesLesson) => {
    navigation.navigate('LessonPlayer', {lessonId: lesson.lessonId});
  };

  return (
    <SeriesDetailView
      series={series}
      onBack={() => navigation.goBack()}
      onOpenLesson={openLesson}
    />
  );
}
