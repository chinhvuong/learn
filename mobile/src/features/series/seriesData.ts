/**
 * Series catalogue data layer — the curated **Series** browse + detail surfaces
 * (§05 sBjQE; design nodes `rl7cV` 17a Browse / `e4eYZ` 17b Detail).
 *
 * A **Series** is an ordered collection of Lessons grouped to be followed in
 * sequence, typically by level (CONTEXT.md → "Series"). At MVP the catalogue is
 * curated by the app team. On the Free Plan one Starter Series is fully open;
 * the rest are locked behind the Paid Plan (the "🔒" rows / locked Lessons).
 *
 * Until the real curated-Series store lands (its owning issue), these are seeded
 * to mirror the design wireframe so the screens render against realistic data.
 * Series/Lesson **titles are English** (Lesson content — the bilingual contrast
 * is the point) and stay verbatim; the chrome around them is Vietnamese.
 */

import type {CefrBand} from '@/features/lesson/types';

/** Per-Lesson state within a Series Detail (drives the leading circle + style). */
export type SeriesLessonStatus = 'done' | 'current' | 'open' | 'locked';

/** One Lesson row inside a Series Detail (`e4eYZ` Lessons). */
export interface SeriesLesson {
  /** Stable Lesson id passed to the Lesson Player route. */
  lessonId: string;
  /** English Source title shown in the row (chrome around it is Vietnamese). */
  title: string;
  /** Estimated length in minutes (the trailing "4′" label). */
  minutes: number;
  status: SeriesLessonStatus;
}

/** A curated Series in the catalogue (`rl7cV` featured cards / `e4eYZ` detail). */
export interface Series {
  id: string;
  /** Vietnamese topic name (curated chrome, e.g. "Công nghệ"). */
  topic: string;
  /** Emoji glyph shown on the thumbnail / banner. */
  emoji: string;
  /** CEFR band this Series is tagged with (for browsing/cold-start, not a gate). */
  band: CefrBand;
  /** Lessons completed so far in this Series. */
  done: number;
  /** Total Lessons in this Series. */
  total: number;
  /** Approximate total runtime in minutes (the Detail meta "~50 phút"). */
  minutes: number;
  /** Featured Series are the open Starter picks shown under "★ Dành cho bạn". */
  featured: boolean;
  /** Whether the learner has started this Series (drives "3/12 bài" vs "mới"). */
  started: boolean;
  /** Ordered Lessons (only carried for Series with a Detail wireframe). */
  lessons?: SeriesLesson[];
}

/** The 12 Công nghệ Lessons mirroring the `e4eYZ` Detail wireframe (3/12 done). */
const TECH_LESSONS: SeriesLesson[] = [
  {lessonId: 'series-tech-1', title: 'The Future of AI', minutes: 4, status: 'done'},
  {lessonId: 'series-tech-2', title: 'Smartphones', minutes: 4, status: 'done'},
  {lessonId: 'series-tech-3', title: 'Cloud computing', minutes: 5, status: 'done'},
  {lessonId: 'series-tech-4', title: 'AI in Healthcare', minutes: 5, status: 'current'},
  {lessonId: 'series-tech-5', title: 'Self-driving cars', minutes: 5, status: 'open'},
  {lessonId: 'series-tech-6', title: 'Quantum basics', minutes: 6, status: 'locked'},
];

/**
 * Seeded curated catalogue mirroring the §05 wireframes (`rl7cV` / `e4eYZ`).
 * The first Series (Công nghệ) is the open Starter and carries the full Lesson
 * list for its Detail; the rest are locked browse rows.
 */
export const SERIES_CATALOGUE: Series[] = [
  {
    id: 'series-tech',
    topic: 'Công nghệ',
    emoji: '💻',
    band: 'B1',
    done: 3,
    total: 12,
    minutes: 50,
    featured: true,
    started: true,
    lessons: TECH_LESSONS,
  },
  {
    id: 'series-travel',
    topic: 'Du lịch',
    emoji: '✈️',
    band: 'B1',
    done: 0,
    total: 10,
    minutes: 42,
    featured: true,
    started: false,
  },
  {id: 'series-business', topic: 'Kinh doanh', emoji: '💼', band: 'B1', done: 0, total: 14, minutes: 60, featured: false, started: false},
  {id: 'series-science', topic: 'Khoa học', emoji: '🔬', band: 'B1', done: 0, total: 12, minutes: 52, featured: false, started: false},
  {id: 'series-film', topic: 'Phim', emoji: '🎬', band: 'B1', done: 0, total: 8, minutes: 36, featured: false, started: false},
  {id: 'series-food', topic: 'Ẩm thực', emoji: '🍳', band: 'B1', done: 0, total: 9, minutes: 40, featured: false, started: false},
];

/** Look up one Series by id (Browse → Detail navigation). */
export function findSeries(id: string): Series | undefined {
  return SERIES_CATALOGUE.find(s => s.id === id);
}

/** The featured (open Starter) Series — the "★ Dành cho bạn" row. */
export const FEATURED_SERIES = SERIES_CATALOGUE.filter(s => s.featured);

/** The remaining locked browse rows ("Tất cả Series"). */
export const LOCKED_SERIES = SERIES_CATALOGUE.filter(s => !s.featured);

/** 1-based index of the current Lesson (for "Tiếp tục bài N →"), if any. */
export function currentLessonIndex(series: Series): number | null {
  if (!series.lessons) {
    return null;
  }
  const idx = series.lessons.findIndex(l => l.status === 'current');
  return idx >= 0 ? idx + 1 : null;
}
