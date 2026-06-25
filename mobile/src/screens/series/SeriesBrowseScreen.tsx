import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {SeriesBrowseView, type Series} from '@/features/series';
import {RootStackScreenProps} from '@/navigation/types';

type Nav = RootStackScreenProps<'SeriesBrowse'>['navigation'];

/**
 * 17a Series — Browse (§05; design node `rl7cV`). The tab screen is thin: it
 * renders the Series Browse feature view and owns routing — tapping a Series
 * opens its Detail (Browse → Detail navigation).
 */
export default function SeriesBrowseScreen() {
  const navigation = useNavigation<Nav>();

  const openSeries = (series: Series) => {
    navigation.navigate('SeriesDetail', {seriesId: series.id});
  };

  return <SeriesBrowseView onOpenSeries={openSeries} />;
}
