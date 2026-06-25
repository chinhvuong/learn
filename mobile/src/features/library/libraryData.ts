/**
 * My Library (Thư viện của tôi) data layer — the learner's own Lessons, grouped
 * for the §02 screen (design node `y5RJTT`; screens.md §08b).
 *
 * A learner's Library spans four groupings:
 *   - **Đang học** — Lessons in progress (a resumable Lesson + its progress).
 *   - **Series đang theo** — Series the learner is currently following.
 *   - **Bạn đã tạo** — Sources the learner imported into Lessons (link/file/text).
 *   - **Đã hoàn thành** — Completed Lessons (the finished history).
 *
 * Until the real per-learner Library store lands (its owning issue), these are
 * seeded to mirror the design wireframe so the screen renders against realistic
 * data. The shapes are deliberately small projections — enough to render a row
 * and deep-link into the Lesson Player — not the full Lesson entity.
 */

import type {HomeLessonRef} from '@/features/home';

/** The Practice Mode a Lesson trains, shown as the "· đọc / · nghe" suffix. */
export type LibrarySkill = 'reading' | 'listening';

/** How a learner-created Source entered the Library (the "Bạn đã tạo" icon). */
export type CreatedSourceKind = 'link' | 'file' | 'text' | 'article';

/** A Lesson the learner is mid-way through (the "Đang học" cards). */
export interface InProgressLesson extends HomeLessonRef {
  /** Emoji thumbnail glyph shown in the leading tile. */
  emoji: string;
  /** "Công nghệ B1 · đọc" — topic/level + Practice Mode subtitle. */
  subtitle: string;
  /** Progress fraction 0–1 for the inline bar. */
  progress: number;
  /** Right-hand progress label — "3/12", "60%", "câu 4/18", etc. */
  progressLabel: string;
}

/** A Series the learner is following (the "Series đang theo" cards). */
export interface FollowedSeries {
  id: string;
  /** Topic name + lesson fraction, e.g. "Công nghệ — 3/12 bài". */
  title: string;
  emoji: string;
  /** Lessons done so far in the Series. */
  done: number;
  /** Total Lessons in the Series. */
  total: number;
}

/** A learner-imported Source turned into a Lesson (the "Bạn đã tạo" rows). */
export interface CreatedLesson {
  id: string;
  title: string;
  /** Source descriptor, e.g. "YouTube · 12:30" or "File · 🔒 chỉ mình bạn". */
  subtitle: string;
  kind: CreatedSourceKind;
  /**
   * The trailing badge: a completion mark, an in-progress %, or "new". Drives
   * the badge color (warm = done, flow = progress, neutral = new).
   */
  badge:
    | {kind: 'done'}
    | {kind: 'progress'; percent: number}
    | {kind: 'new'};
}

/** A finished Lesson in the completed history (the "Đã hoàn thành" rows). */
export interface CompletedLesson {
  id: string;
  title: string;
  /** Relative completion time, e.g. "hôm qua", "3 ngày trước". */
  whenKey: string;
}

export interface LibraryData {
  inProgress: InProgressLesson[];
  series: FollowedSeries[];
  created: CreatedLesson[];
  completed: CompletedLesson[];
  /** Total completed count (the "Đã hoàn thành 12" badge + "see all" CTA). */
  completedTotal: number;
}

/**
 * Seeded Library mirroring the design wireframe (`y5RJTT`). Relative-time labels
 * are i18n keys so the chrome stays Vietnamese; English titles are Lesson
 * content (the bilingual contrast is the point) and stay verbatim.
 */
export const LIBRARY_DATA: LibraryData = {
  inProgress: [
    {
      lessonId: 'the-future-of-ai',
      title: 'The Future of AI',
      emoji: '💻',
      subtitle: 'Công nghệ B1 · đọc',
      estimatedMinutes: 4,
      seriesName: 'Công nghệ B1',
      seriesIndex: 3,
      seriesTotal: 12,
      progress: 3 / 12,
      progressLabel: '3/12',
    },
    {
      lessonId: 'how-memory-works',
      title: 'How memory works',
      emoji: '🧠',
      subtitle: 'Bài lẻ · đọc',
      estimatedMinutes: 6,
      progress: 0.6,
      progressLabel: '60%',
    },
    {
      lessonId: 'daily-english-12',
      title: 'Daily English · tập 12',
      emoji: '🎧',
      subtitle: 'Podcast · nghe',
      estimatedMinutes: 8,
      progress: 4 / 18,
      progressLabel: 'câu 4/18',
    },
  ],
  series: [
    {id: 'series-tech', title: 'Công nghệ — 3/12 bài', emoji: '💻', done: 3, total: 12},
    {id: 'series-travel', title: 'Du lịch — 1/10 bài', emoji: '✈️', done: 1, total: 10},
  ],
  created: [
    {
      id: 'created-future-of-ai',
      title: 'The Future of AI',
      subtitle: 'YouTube · 12:30',
      kind: 'link',
      badge: {kind: 'done'},
    },
    {
      id: 'created-ielts-cam18',
      title: 'Bài đọc IELTS — Cambridge 18',
      subtitle: 'File · 🔒 chỉ mình bạn',
      kind: 'file',
      badge: {kind: 'progress', percent: 40},
    },
    {
      id: 'created-meeting-notes',
      title: 'Ghi chú họp · đoạn dán',
      subtitle: 'Text · 🔒 chỉ mình bạn',
      kind: 'text',
      badge: {kind: 'done'},
    },
    {
      id: 'created-why-we-sleep',
      title: 'Why we sleep',
      subtitle: 'Bài báo · medium.com',
      kind: 'article',
      badge: {kind: 'new'},
    },
  ],
  completed: [
    {id: 'done-smartphones', title: 'Smartphones', whenKey: 'LIBRARY_WHEN_YESTERDAY'},
    {id: 'done-cloud', title: 'Cloud computing', whenKey: 'LIBRARY_WHEN_3_DAYS'},
    {id: 'done-tea', title: 'A short history of tea', whenKey: 'LIBRARY_WHEN_LAST_WEEK'},
  ],
  completedTotal: 12,
};

/** The Library filter chips across the top (design `Filters`). */
export type LibraryFilter = 'all' | 'learning' | 'done' | 'created';

export const LIBRARY_FILTERS: {key: LibraryFilter; labelKey: string}[] = [
  {key: 'all', labelKey: 'LIBRARY_FILTER_ALL'},
  {key: 'learning', labelKey: 'LIBRARY_FILTER_LEARNING'},
  {key: 'done', labelKey: 'LIBRARY_FILTER_DONE'},
  {key: 'created', labelKey: 'LIBRARY_FILTER_CREATED'},
];
