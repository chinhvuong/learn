/**
 * Series feature — the curated **Series** browse + detail surfaces (§05 sBjQE;
 * design `rl7cV` / `e4eYZ`). A Series is an ordered collection of Lessons
 * grouped to be followed in sequence, typically by level (CONTEXT.md → "Series").
 * Public surface of the feature.
 */

export {
  SERIES_CATALOGUE,
  FEATURED_SERIES,
  LOCKED_SERIES,
  findSeries,
  currentLessonIndex,
} from './seriesData';
export type {Series, SeriesLesson, SeriesLessonStatus} from './seriesData';

export {default as SeriesBrowseView} from './components/SeriesBrowseView';
export {default as SeriesDetailView} from './components/SeriesDetailView';
