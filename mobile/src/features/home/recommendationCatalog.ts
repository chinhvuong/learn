/**
 * The seeded recommendation catalog — the Lesson-level shared derived layer the
 * Next Lesson engine matches against (CONTEXT.md → "Next Lesson recommendation",
 * ADR-0001), bundled in-app so the recommendation seam runs with no backend yet.
 *
 * It covers all three live source tiers so the A→B→D priority is demonstrable:
 *   - tier **A** (series): the learner's current Starter Series ("Công nghệ B1");
 *   - tier **B** (pool): the pre-generated curated pool, varied topic/author;
 *   - tier **D** (own): the next part of the learner's own imported Sources.
 *
 * The real catalog is the backend's shared Candidate-Item-derived Lesson index;
 * this fixture honours the same tags (topic/author/keyword/format + per-skill
 * difficulty) so when the API lands the engine call is unchanged.
 */

import type {HomeState} from './homeSlice';
import type {CatalogLesson, RecoLearner} from './recommendation';

/** The learner's current Starter Series (matched in onboarding to "Công nghệ"). */
export const CURRENT_SERIES_ID = 'series-tech-b1';
export const CURRENT_SERIES_NAME = 'Công nghệ B1';
const SERIES_TOTAL = 12;

/**
 * Seed catalog. Difficulties are fine 0–100 Level scores (cefr.ts bands: B1≈34,
 * B2≈50). The Series sits at B1 around the learner's Reading Level; the pool and
 * own Sources spread across topics so Interest-Profile matching has signal.
 */
export const RECOMMENDATION_CATALOG: CatalogLesson[] = [
  // --- Tier A · the current Series (next-in-sequence wins outright) ---
  {
    lessonId: 'series-tech-b1-04',
    title: 'How Search Engines Rank Pages',
    estimatedMinutes: 5,
    skill: 'reading',
    difficulty: 42, // B1, a notch above the learner's Reading Level
    topic: 'Công nghệ',
    author: 'Inflow',
    keywords: ['AI', 'web'],
    format: 'bài viết',
    source: 'series',
    seriesId: CURRENT_SERIES_ID,
    seriesName: CURRENT_SERIES_NAME,
    seriesIndex: 4,
    seriesTotal: SERIES_TOTAL,
  },
  {
    lessonId: 'series-tech-b1-05',
    title: 'What a Database Really Does',
    estimatedMinutes: 5,
    skill: 'reading',
    difficulty: 44,
    topic: 'Công nghệ',
    author: 'Inflow',
    keywords: ['data'],
    format: 'bài viết',
    source: 'series',
    seriesId: CURRENT_SERIES_ID,
    seriesName: CURRENT_SERIES_NAME,
    seriesIndex: 5,
    seriesTotal: SERIES_TOTAL,
  },

  // --- Tier B · the curated pool (Interest-Profile + Level matched) ---
  {
    lessonId: 'pool-ai-healthcare',
    title: 'AI in Healthcare',
    estimatedMinutes: 5,
    skill: 'reading',
    difficulty: 45, // B1 — the design handoff's Top pick (Công nghệ, 94%)
    topic: 'Công nghệ',
    author: 'The Verge',
    keywords: ['AI', 'sức khỏe'],
    format: 'bài viết',
    source: 'pool',
  },
  {
    lessonId: 'pool-remote-work',
    title: 'The Rise of Remote Work',
    estimatedMinutes: 4,
    skill: 'reading',
    difficulty: 41,
    topic: 'Công nghệ',
    author: 'Inflow',
    keywords: ['work'],
    format: 'bài viết',
    source: 'pool',
  },
  {
    lessonId: 'pool-world-cup',
    title: 'Inside a World Cup Final',
    estimatedMinutes: 6,
    skill: 'reading',
    difficulty: 47,
    topic: 'Thể thao',
    author: 'BBC',
    keywords: ['bóng đá'],
    format: 'bài viết',
    source: 'pool',
  },
  {
    lessonId: 'pool-coffee-science',
    title: 'The Science of Coffee',
    estimatedMinutes: 5,
    skill: 'reading',
    difficulty: 36, // easier — the momentum-ease candidate when topic matches
    topic: 'Ẩm thực',
    author: 'Inflow',
    keywords: ['cà phê'],
    format: 'bài viết',
    source: 'pool',
  },

  // --- Tier D · the learner's own imported Sources (next part) ---
  {
    lessonId: 'own-cap-theorem-2',
    title: 'CAP Theorem, Part 2',
    estimatedMinutes: 5,
    skill: 'reading',
    difficulty: 46,
    topic: 'Công nghệ',
    author: 'Martin Kleppmann',
    keywords: ['CAP theorem', 'data'],
    format: 'blog',
    source: 'own',
  },
];

/**
 * Derive the engine's `RecoLearner` from the persisted Home state. The Interest
 * Profile is seeded toward Công nghệ (the onboarding topic pick) so the default
 * recommendation matches the design handoff; real signals accrue from completed
 * Lessons later (CONTEXT.md → "Interest Profile").
 */
export function learnerFromHome(home: HomeState): RecoLearner {
  return {
    readingLevel: home.readingLevel,
    listeningLevel: home.listeningLevel,
    currentSeriesId: home.currentSeriesId,
    currentSeriesPosition: home.currentSeriesPosition,
    interest: {
      topics: {'Công nghệ': 1, 'Thể thao': 0.3},
      authors: {'The Verge': 0.5, 'Martin Kleppmann': 0.4},
      keywords: {AI: 0.8, 'CAP theorem': 0.6, data: 0.3},
      formats: {'bài viết': 0.6, blog: 0.3},
    },
  };
}
