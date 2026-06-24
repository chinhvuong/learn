/**
 * Behaviour tests at the `nextLesson` seam (issue #13). They pin a fixed catalog
 * and assert the contract both consumers rely on:
 *   - sourcing priority A (current Series) → B (curated pool) → D (own Sources);
 *   - matching on per-skill Level (Reading vs Listening) + Interest Profile;
 *   - the occasional momentum ease (a slightly easier Lesson);
 *   - every recommendation carries a Recommendation Reason + a match %.
 */

import {nextLesson} from './recommendation';
import type {CatalogLesson, RecoLearner} from './recommendation';

/** A learner at Reading B1 (≈40) / Listening A2 (≈24), keen on Công nghệ. */
function learner(overrides: Partial<RecoLearner> = {}): RecoLearner {
  return {
    readingLevel: 40,
    listeningLevel: 24,
    interest: {
      topics: {'Công nghệ': 1},
      authors: {},
      keywords: {AI: 0.8},
      formats: {'bài viết': 0.5},
    },
    ...overrides,
  };
}

const seriesNext: CatalogLesson = {
  lessonId: 'series-next',
  title: 'Series Next Lesson',
  estimatedMinutes: 5,
  skill: 'reading',
  difficulty: 44,
  topic: 'Công nghệ',
  author: 'Inflow',
  keywords: [],
  format: 'bài viết',
  source: 'series',
  seriesId: 'series-tech-b1',
  seriesName: 'Công nghệ B1',
  seriesIndex: 4,
  seriesTotal: 12,
};

const poolMatch: CatalogLesson = {
  lessonId: 'pool-ai',
  title: 'AI in Healthcare',
  estimatedMinutes: 5,
  skill: 'reading',
  difficulty: 45,
  topic: 'Công nghệ',
  author: 'The Verge',
  keywords: ['AI'],
  format: 'bài viết',
  source: 'pool',
};

const poolOffTopic: CatalogLesson = {
  lessonId: 'pool-sport',
  title: 'Inside a World Cup Final',
  estimatedMinutes: 6,
  skill: 'reading',
  difficulty: 46,
  topic: 'Thể thao',
  author: 'BBC',
  keywords: ['bóng đá'],
  format: 'bài viết',
  source: 'pool',
};

const ownNext: CatalogLesson = {
  lessonId: 'own-cap-2',
  title: 'CAP Theorem, Part 2',
  estimatedMinutes: 5,
  skill: 'reading',
  difficulty: 45,
  topic: 'Công nghệ',
  author: 'Martin Kleppmann',
  keywords: ['CAP theorem'],
  format: 'blog',
  source: 'own',
};

describe('nextLesson — sourcing priority A → B → D', () => {
  it('A: serves the next-in-Series Lesson when the learner is mid-Series', () => {
    const reco = nextLesson(
      learner({currentSeriesId: 'series-tech-b1', currentSeriesPosition: 3}),
      [seriesNext, poolMatch, ownNext],
    );
    expect(reco).not.toBeNull();
    expect(reco!.source).toBe('series');
    expect(reco!.lesson.lessonId).toBe('series-next');
  });

  it('A: picks the LOWEST unfinished index in the current Series', () => {
    const later = {...seriesNext, lessonId: 'series-5', seriesIndex: 5};
    const reco = nextLesson(
      learner({currentSeriesId: 'series-tech-b1', currentSeriesPosition: 3}),
      [later, seriesNext],
    );
    expect(reco!.lesson.lessonId).toBe('series-next'); // index 4 before 5
  });

  it('B: falls to the curated pool when no Series is in progress', () => {
    const reco = nextLesson(learner(), [poolMatch, poolOffTopic, ownNext]);
    expect(reco!.source).toBe('pool');
    expect(reco!.lesson.lessonId).toBe('pool-ai');
  });

  it('B over D: the pool beats own Sources on a tie', () => {
    // Give pool + own identical tags/difficulty so only the tier breaks the tie.
    const pool = {...poolMatch, lessonId: 'pool-tie', author: 'Tie', keywords: []};
    const own = {...ownNext, lessonId: 'own-tie', author: 'Tie', keywords: [], format: 'bài viết', difficulty: 45};
    const l = learner({interest: {topics: {'Công nghệ': 1}, authors: {}, keywords: {}, formats: {}}});
    const reco = nextLesson(l, [own, pool]);
    expect(reco!.source).toBe('pool');
  });

  it('D: serves own Sources when the pool has nothing matching', () => {
    const reco = nextLesson(learner(), [poolOffTopic, ownNext]);
    // Công-nghệ own Source beats the off-topic sport pool Lesson on Interest.
    expect(reco!.source).toBe('own');
    expect(reco!.lesson.lessonId).toBe('own-cap-2');
  });

  it('returns null when the catalog has nothing eligible', () => {
    expect(nextLesson(learner(), [])).toBeNull();
  });
});

describe('nextLesson — per-skill Level matching (i+1)', () => {
  it('prefers a Lesson a notch above the learner Level over a too-hard one', () => {
    const iPlus1 = {...poolMatch, lessonId: 'b1-plus', difficulty: 48};
    const tooHard = {...poolMatch, lessonId: 'c1', difficulty: 80};
    const reco = nextLesson(learner(), [tooHard, iPlus1]);
    expect(reco!.lesson.lessonId).toBe('b1-plus');
  });

  it('matches each skill against its OWN Level (Reading ≠ Listening)', () => {
    // Listening Level is A2 (24); a B2 listening Lesson is far too hard, while a
    // listening Lesson near A2+1 wins for the same learner.
    const farListening = {...poolMatch, lessonId: 'listen-hard', skill: 'listening' as const, difficulty: 60};
    const fitListening = {...poolMatch, lessonId: 'listen-fit', skill: 'listening' as const, difficulty: 30};
    const reco = nextLesson(learner(), [farListening, fitListening]);
    expect(reco!.lesson.lessonId).toBe('listen-fit');
  });

  it('does not recommend a Lesson far below the learner Level (too easy)', () => {
    const tooEasy = {...poolMatch, lessonId: 'a1', difficulty: 5};
    const fit = {...poolMatch, lessonId: 'fit', difficulty: 46};
    const reco = nextLesson(learner(), [tooEasy, fit]);
    expect(reco!.lesson.lessonId).toBe('fit');
  });
});

describe('nextLesson — Interest Profile influence', () => {
  it('a topic match outranks an off-topic Lesson at the same Level', () => {
    const onTopic = {...poolMatch, lessonId: 'on', topic: 'Công nghệ', keywords: []};
    const offTopic = {...poolMatch, lessonId: 'off', topic: 'Âm nhạc', keywords: []};
    const reco = nextLesson(learner(), [offTopic, onTopic]);
    expect(reco!.lesson.lessonId).toBe('on');
  });

  it('flipping the learner Interest flips the recommendation', () => {
    const tech = {...poolMatch, lessonId: 'tech', topic: 'Công nghệ', keywords: []};
    const sport = {...poolMatch, lessonId: 'sport', topic: 'Thể thao', keywords: []};
    const techFan = learner({interest: {topics: {'Công nghệ': 1}, authors: {}, keywords: {}, formats: {}}});
    const sportFan = learner({interest: {topics: {'Thể thao': 1}, authors: {}, keywords: {}, formats: {}}});
    expect(nextLesson(techFan, [tech, sport])!.lesson.lessonId).toBe('tech');
    expect(nextLesson(sportFan, [tech, sport])!.lesson.lessonId).toBe('sport');
  });

  it('an author match raises a Lesson the learner keeps returning to', () => {
    const byFavAuthor = {...poolMatch, lessonId: 'fav', topic: 'Thể thao', author: 'Martin Kleppmann', keywords: []};
    const generic = {...poolMatch, lessonId: 'generic', topic: 'Thể thao', author: 'Nobody', keywords: []};
    const l = learner({interest: {topics: {}, authors: {'Martin Kleppmann': 1}, keywords: {}, formats: {}}});
    expect(nextLesson(l, [generic, byFavAuthor])!.lesson.lessonId).toBe('fav');
  });
});

describe('nextLesson — occasional momentum ease', () => {
  it('serves a slightly easier Lesson for momentum, flagged + phrased honestly', () => {
    // Only an easier (below-Level but within the ease window) Công-nghệ Lesson is
    // on-topic; a harder off-topic Lesson is the alternative. The strong Interest
    // signal lets the easier on-topic Lesson win — the momentum ease.
    const easierOnTopic = {...poolMatch, lessonId: 'easy-tech', topic: 'Công nghệ', difficulty: 33, keywords: ['AI']};
    const harderOffTopic = {...poolMatch, lessonId: 'hard-music', topic: 'Âm nhạc', difficulty: 50, keywords: []};
    const reco = nextLesson(learner(), [harderOffTopic, easierOnTopic]);
    expect(reco!.lesson.lessonId).toBe('easy-tech');
    expect(reco!.eased).toBe(true);
    expect(reco!.reason).toContain('giữ đà');
  });

  it('does NOT flag a normal i+1 pick as eased', () => {
    const reco = nextLesson(learner(), [poolMatch]);
    expect(reco!.eased).toBe(false);
  });
});

describe('nextLesson — Recommendation Reason + match %', () => {
  it('every recommendation carries a non-empty Reason and a sane match %', () => {
    for (const cat of [[seriesNext, poolMatch], [poolMatch], [ownNext]]) {
      const l = cat[0].source === 'series'
        ? learner({currentSeriesId: 'series-tech-b1', currentSeriesPosition: 3})
        : learner();
      const reco = nextLesson(l, cat)!;
      expect(reco.reason.length).toBeGreaterThan(0);
      expect(reco.matchPct).toBeGreaterThanOrEqual(0);
      expect(reco.matchPct).toBeLessThanOrEqual(100);
    }
  });

  it('grounds the Reason in the matched signal (topic) and exposes signal tags', () => {
    const reco = nextLesson(learner(), [poolMatch])!;
    expect(reco.reason).toContain('Công nghệ');
    expect(reco.tags.some(t => t.axis === 'topic' && t.value === 'Công nghệ')).toBe(true);
  });

  it('phrases a Series continuation honestly', () => {
    const reco = nextLesson(
      learner({currentSeriesId: 'series-tech-b1', currentSeriesPosition: 3}),
      [seriesNext],
    )!;
    expect(reco.reason).toContain('series');
    expect(reco.matchPct).toBeGreaterThan(80);
  });

  it('excludes the just-completed Lesson from the recommendation', () => {
    const reco = nextLesson(learner(), [poolMatch, poolOffTopic], 'pool-ai')!;
    expect(reco.lesson.lessonId).not.toBe('pool-ai');
  });
});
