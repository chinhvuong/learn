/**
 * The Next Lesson recommendation engine (CONTEXT.md → "Next Lesson
 * recommendation"; PRD recommendation flow; issue #13).
 *
 * `nextLesson(learner, catalog, justCompleted?)` sources the Lesson to surface
 * next so the learner keeps momentum. It is the single seam both consumers call:
 *   - the Completion recap (screens.md §11) recommends it immediately after a
 *     Lesson and preloads it for one-tap "Học tiếp";
 *   - Home's Continue (screens.md §8) falls back to it when nothing is in
 *     progress.
 *
 * Sourcing priority (CONTEXT.md): **A** the next Lesson in the learner's current
 * Series → **B** a matching Lesson from the pre-generated curated pool → **D**
 * the next part of the learner's own imported Sources. (On-the-fly web
 * generation, C, is deferred past MVP.) Within and across those tiers, matching
 * uses the learner's **per-skill Level** (Reading vs Listening, the i+1 target)
 * and their **Interest Profile** (topic / author / keyword / format), and the
 * engine **mostly serves i+1 but may occasionally ease** for momentum. Every
 * result carries a human-readable **Recommendation Reason** and a **match %**.
 *
 * This is a pure function over an explicit catalog so the seam is fully testable
 * without a backend (the catalog is the shared derived layer of ADR-0001 —
 * Candidate-Item-level analysis is irrelevant here; recommendation matches on
 * Lesson-level Level + topic/author/keyword/format tags only).
 */

import type {CefrBand} from '@/features/lesson/types';
import {scoreToCefr} from './cefr';
import type {HomeLessonRef} from './homeSlice';

/** Which skill's Level a Lesson is matched against (CONTEXT.md → "Level"). */
export type RecoSkill = 'reading' | 'listening';

/** Source tier a recommendation came from (CONTEXT.md → "Next Lesson recommendation"). */
export type RecoSource = 'series' | 'pool' | 'own';

/**
 * The Interest Profile signals matching reads (CONTEXT.md → "Interest Profile"):
 * topic, author/source, keyword, and format — each independently weightable.
 * Stored as the catalog Lesson's tags; the learner's profile holds weighted
 * preferences over the same axes.
 */
export interface InterestSignals {
  topic: string;
  author: string;
  keywords: string[];
  format: string;
}

/**
 * A candidate Lesson in the recommendation catalog — the Lesson-level tags the
 * engine matches on (the shared derived layer, not the per-learner projection).
 */
export interface CatalogLesson extends InterestSignals {
  lessonId: string;
  /** English Source title shown in the card (Vietnamese chrome around it). */
  title: string;
  /** Estimated length in minutes (the "5 phút" line). */
  estimatedMinutes: number;
  /** Which skill this Lesson trains — matched against that skill's Level. */
  skill: RecoSkill;
  /** Reading/Listening difficulty as a fine 0–100 Level score (matched i+1). */
  difficulty: number;

  /** Series this Lesson belongs to (tier A), if any. */
  seriesId?: string;
  seriesName?: string;
  /** 1-based position within its Series (drives the next-in-Series pick). */
  seriesIndex?: number;
  seriesTotal?: number;

  /** Which source tier this Lesson is sourced from (A series / B pool / D own). */
  source: RecoSource;
}

/**
 * The learner state the engine matches against. Holds the two per-skill Levels
 * (fine 0–100 scores), the current Series progress, and the Interest Profile as
 * weighted signal sets. Kept minimal and serialisable so it reads straight off
 * the persisted `home` slice.
 */
export interface RecoLearner {
  /** Reading Level — fine 0–100 score; matched i+1 for reading Lessons. */
  readingLevel: number;
  /** Listening Level — fine 0–100 score; matched i+1 for listening Lessons. */
  listeningLevel: number;

  /** The Series the learner is currently progressing through (tier A), if any. */
  currentSeriesId?: string;
  /** 1-based index of the LAST Lesson the learner finished in that Series. */
  currentSeriesPosition?: number;

  /** Interest Profile — weighted preferences over the four signal axes. */
  interest: {
    topics: Record<string, number>;
    authors: Record<string, number>;
    keywords: Record<string, number>;
    formats: Record<string, number>;
  };
}

/** A scored signal that contributed to the match (drives the Reason + tags). */
export interface RecoSignalTag {
  axis: 'topic' | 'author' | 'keyword' | 'format' | 'level';
  /** Display value of the matched signal (e.g. "Công nghệ"). */
  value: string;
}

/**
 * A Next Lesson recommendation: a Lesson reference to deep-link into, plus the
 * Recommendation Reason and match % the UI must show with every recommendation
 * (CONTEXT.md → "Recommendation Reason").
 */
export interface Recommendation {
  /** The recommended Lesson, in the same compact shape Home/Completion render. */
  lesson: HomeLessonRef;
  /** Which source tier it came from (A series / B pool / D own). */
  source: RecoSource;
  /** Human-readable, behaviour-grounded Reason (Vietnamese), e.g. "vì bạn thích chủ đề Công nghệ". */
  reason: string;
  /** Match strength 0–100, shown as "94%". */
  matchPct: number;
  /** The signals that drove the match (for tags / debugging). */
  tags: RecoSignalTag[];
  /** Whether the engine eased below i+1 to preserve momentum (CONTEXT.md). */
  eased: boolean;
  /** CEFR band of the recommended Lesson (for the Reason "ở trình độ Bx"). */
  cefr: CefrBand;
}

/**
 * How far above the learner's current Level the i+1 target sits, in fine-score
 * points (~half a CEFR band). The engine prefers Lessons near this target.
 */
const I_PLUS_ONE_STEP = 8;

/**
 * The widest the engine eases *below* the learner's Level for momentum. A Lesson
 * easier than this is treated as too easy and not eased onto.
 */
const MAX_EASE_BELOW = 10;

/** Score weights per matched Interest signal (topic dominates — CONTEXT.md). */
const SIGNAL_WEIGHTS: Record<RecoSignalTag['axis'], number> = {
  topic: 26,
  author: 16,
  keyword: 7,
  format: 9,
  level: 0,
};

/** The learner's Level for the skill a candidate trains. */
function levelForSkill(learner: RecoLearner, skill: RecoSkill): number {
  return skill === 'listening' ? learner.listeningLevel : learner.readingLevel;
}

/**
 * Level-fit score 0–40: peaks when the Lesson sits at the i+1 target (a notch
 * harder), tapers for harder Lessons, and tapers faster below the learner's
 * Level — but stays positive within the ease window so a *slightly* easier
 * Lesson remains eligible for a momentum pick.
 */
function levelFit(learner: RecoLearner, lesson: CatalogLesson): number {
  const level = levelForSkill(learner, lesson.skill);
  const target = level + I_PLUS_ONE_STEP;
  const delta = lesson.difficulty - target; // <0 easier than target, >0 harder
  const distance = Math.abs(delta);
  // Linear taper from the target; below-Level Lessons taper twice as fast.
  const below = lesson.difficulty < level;
  const penaltyPerPoint = below ? 2.2 : 1.1;
  return Math.max(0, 40 - distance * penaltyPerPoint);
}

/** Sum of weighted Interest-Profile matches, with the signals that fired. */
function interestScore(
  learner: RecoLearner,
  lesson: CatalogLesson,
): {score: number; tags: RecoSignalTag[]} {
  const tags: RecoSignalTag[] = [];
  let score = 0;

  const topicW = learner.interest.topics[lesson.topic] ?? 0;
  if (topicW > 0) {
    score += SIGNAL_WEIGHTS.topic * topicW;
    tags.push({axis: 'topic', value: lesson.topic});
  }

  const authorW = learner.interest.authors[lesson.author] ?? 0;
  if (authorW > 0) {
    score += SIGNAL_WEIGHTS.author * authorW;
    tags.push({axis: 'author', value: lesson.author});
  }

  const formatW = learner.interest.formats[lesson.format] ?? 0;
  if (formatW > 0) {
    score += SIGNAL_WEIGHTS.format * formatW;
    tags.push({axis: 'format', value: lesson.format});
  }

  for (const kw of lesson.keywords) {
    const kwW = learner.interest.keywords[kw] ?? 0;
    if (kwW > 0) {
      score += SIGNAL_WEIGHTS.keyword * kwW;
      tags.push({axis: 'keyword', value: kw});
    }
  }

  return {score, tags};
}

/**
 * Whether a candidate is eligible at all: it must not be one the learner just
 * completed, and it must sit within the [Level − MAX_EASE_BELOW, …] window so
 * the engine never recommends something far too easy.
 */
function isEligible(
  learner: RecoLearner,
  lesson: CatalogLesson,
  justCompletedId?: string,
): boolean {
  if (lesson.lessonId === justCompletedId) {
    return false;
  }
  const level = levelForSkill(learner, lesson.skill);
  return lesson.difficulty >= level - MAX_EASE_BELOW;
}

/** The next unfinished Lesson in the learner's current Series (tier A), if any. */
function nextInCurrentSeries(
  learner: RecoLearner,
  catalog: CatalogLesson[],
  justCompletedId?: string,
): CatalogLesson | undefined {
  if (!learner.currentSeriesId) {
    return undefined;
  }
  const position = learner.currentSeriesPosition ?? 0;
  return catalog
    .filter(
      l =>
        l.source === 'series' &&
        l.seriesId === learner.currentSeriesId &&
        (l.seriesIndex ?? 0) > position &&
        l.lessonId !== justCompletedId,
    )
    .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))[0];
}

/** Tier priority weight: A series wins ties over B pool over D own. */
const SOURCE_PRIORITY: Record<RecoSource, number> = {
  series: 1000,
  pool: 0,
  own: -1000,
};

/**
 * Build the Vietnamese Recommendation Reason from the strongest signal that
 * fired, grounded in the learner's behaviour (CONTEXT.md examples). Series
 * continuation and momentum eases get their own honest phrasings.
 */
function buildReason(
  source: RecoSource,
  tags: RecoSignalTag[],
  cefr: CefrBand,
  eased: boolean,
): string {
  if (source === 'series') {
    return `vì là bài tiếp theo trong series của bạn`;
  }
  const topic = tags.find(t => t.axis === 'topic');
  const author = tags.find(t => t.axis === 'author');
  const keyword = tags.find(t => t.axis === 'keyword');
  const format = tags.find(t => t.axis === 'format');

  let core: string;
  if (topic) {
    core = `vì bạn thích chủ đề ${topic.value}`;
  } else if (author) {
    core = `vì bạn hay đọc của ${author.value}`;
  } else if (keyword) {
    core = `vì bạn quan tâm “${keyword.value}”`;
  } else if (format) {
    core = `vì bạn thích dạng ${format.value}`;
  } else {
    core = `phù hợp với trình độ ${cefr} của bạn`;
  }
  if (eased) {
    return `${core} — nhẹ hơn một chút để giữ đà`;
  }
  return core;
}

/**
 * Map a raw match score to a presentable match % (0–100). Scores are squashed
 * into a confident-feeling 60–98 range so the card never shows a discouraging
 * low number, while still ordering candidates by real fit.
 */
function toMatchPct(rawScore: number): number {
  const clamped = Math.max(0, Math.min(100, rawScore));
  return Math.round(60 + (clamped / 100) * 38);
}

/** Internal: score one candidate fully (level + interest). */
function scoreCandidate(learner: RecoLearner, lesson: CatalogLesson) {
  const level = levelFit(learner, lesson);
  const {score: interest, tags} = interestScore(learner, lesson);
  const eased = lesson.difficulty < levelForSkill(learner, lesson.skill);
  const raw = level + interest;
  return {lesson, level, interest, raw, tags, eased};
}

function toRef(lesson: CatalogLesson): HomeLessonRef {
  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    estimatedMinutes: lesson.estimatedMinutes,
    seriesName: lesson.seriesName,
    seriesIndex: lesson.seriesIndex,
    seriesTotal: lesson.seriesTotal,
  };
}

/**
 * Recommend the Next Lesson for `learner` from `catalog`, optionally excluding
 * the Lesson `justCompleted` (so completion never re-recommends the same one).
 *
 * Priority A→B→D: the next Lesson in the current Series wins outright when one
 * exists; otherwise the best-matching Lesson is chosen by combined Level-fit +
 * Interest-Profile score, with the source tier (B pool over D own) breaking
 * ties. Returns `null` only when the catalog has nothing eligible.
 */
export function nextLesson(
  learner: RecoLearner,
  catalog: CatalogLesson[],
  justCompleted?: string,
): Recommendation | null {
  // --- Tier A: continue the current Series outright (momentum > discovery). ---
  const seriesNext = nextInCurrentSeries(learner, catalog, justCompleted);
  if (seriesNext) {
    const cefr = scoreToCefr(seriesNext.difficulty);
    const {tags} = interestScore(learner, seriesNext);
    return {
      lesson: toRef(seriesNext),
      source: 'series',
      reason: buildReason('series', tags, cefr, false),
      matchPct: toMatchPct(92), // a Series continuation is a near-certain fit
      tags,
      eased: false,
      cefr,
    };
  }

  // --- Tiers B then D: best match by Level + Interest, tier breaks ties. ---
  const eligible = catalog.filter(l => isEligible(learner, l, justCompleted));
  if (eligible.length === 0) {
    return null;
  }

  const scored = eligible
    .map(l => scoreCandidate(learner, l))
    .sort((a, b) => {
      const byScore = b.raw - a.raw;
      if (Math.abs(byScore) > 0.001) {
        return byScore;
      }
      return SOURCE_PRIORITY[b.lesson.source] - SOURCE_PRIORITY[a.lesson.source];
    });

  const best = scored[0];
  const cefr = scoreToCefr(best.lesson.difficulty);
  return {
    lesson: toRef(best.lesson),
    source: best.lesson.source,
    reason: buildReason(best.lesson.source, best.tags, cefr, best.eased),
    matchPct: toMatchPct(best.raw),
    tags: best.tags,
    eased: best.eased,
    cefr,
  };
}
