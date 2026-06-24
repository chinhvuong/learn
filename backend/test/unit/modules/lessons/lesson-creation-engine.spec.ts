/// <reference types="jest" />

import {
  CandidateItemEntity,
  CandidateItemsRepository,
  ItemEntity,
  ItemsRepository,
  LessonEntity,
  LessonsRepository,
  SourceEntity,
  SourcesRepository,
} from '@database/postgres';
import {
  Analyzer,
  ChunkMatcher,
  ContentFetcher,
  CreationCreditService,
  FetchedContent,
  GrammarMatcher,
  ItemConfidence,
  ItemType,
  SourceCache,
  SourceInput,
  SourceType,
  Translator,
} from '@modules/lessons';
import { LessonCreationEngine } from '@modules/lessons/services/lesson-creation-engine.service';

/**
 * Reference behavior test for the Lesson Creation Engine (issue #3).
 *
 * Every external port is faked; assertions are made ONLY at the `createLesson`
 * seam (the returned Lessons and what got persisted), never on the engine's
 * internal implementation. This file establishes the test pattern for the
 * curated-content production line.
 */

// --- In-memory persistence ---------------------------------------------------

let idCounter = 0;
const nextId = (): string => `id-${++idCounter}`;

/** Minimal in-memory store standing in for a TypeORM repository. */
class FakeStore<T extends { id: string }> {
  readonly rows: T[] = [];
  create(partial: Partial<T>): T {
    return { ...partial } as T;
  }
  async save(entity: T): Promise<T> {
    if (!entity.id) {
      entity.id = nextId();
    }
    this.rows.push(entity);
    return entity;
  }
}

class FakeSources extends FakeStore<SourceEntity> {
  async findByFingerprint(
    contentHash: string,
    normalizedUrl: string | null,
  ): Promise<SourceEntity | null> {
    return (
      this.rows.find(
        (s) =>
          s.contentHash === contentHash || (!!normalizedUrl && s.normalizedUrl === normalizedUrl),
      ) ?? null
    );
  }
}

class FakeLessons extends FakeStore<LessonEntity> {
  async findBySourceId(sourceId: string): Promise<LessonEntity[]> {
    return this.rows
      .filter((l) => l.sourceId === sourceId)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);
  }
}

class FakeItems extends FakeStore<ItemEntity> {
  async findByLessonId(lessonId: string): Promise<ItemEntity[]> {
    return this.rows.filter((i) => i.lessonId === lessonId);
  }
}

class FakeCandidateItems extends FakeStore<CandidateItemEntity> {
  async findBySourceId(sourceId: string): Promise<CandidateItemEntity[]> {
    return this.rows.filter((c) => c.sourceId === sourceId);
  }
}

// --- Faked ports -------------------------------------------------------------

class StubContentFetcher implements ContentFetcher {
  fetch = jest.fn(
    async (input: SourceInput): Promise<FetchedContent> => ({
      type: input.type,
      title: input.title ?? null,
      normalizedUrl: input.url ? input.url.replace(/\/$/, '') : null,
      fullText: (input.text ?? 'fetched body').trim(),
      language: input.language ?? 'en',
      durationSeconds: input.text ? Math.max(1, input.text.split(/\s+/).length) : 60,
    }),
  );
}

class StubAnalyzer implements Analyzer {
  analyze = jest.fn(async () => ({
    vocabulary: [
      { lemma: 'reluctant', surface: 'reluctant', level: 60 },
      { lemma: 'negotiate', surface: 'negotiate', level: 55 },
    ],
    metadata: { topic: 'business', author: 'Jane Doe' },
  }));
}

class StubGrammarMatcher implements GrammarMatcher {
  match = jest.fn(async () => [
    {
      inventoryId: 'GP_PRESENT_PERFECT',
      lemma: 'present perfect',
      surface: 'has decided',
      level: 45,
    },
  ]);
}

class StubChunkMatcher implements ChunkMatcher {
  match = jest.fn(async () => [
    {
      inventoryId: 'CH_MAKE_A_DECISION',
      lemma: 'make a decision',
      surface: 'made a decision',
      confidence: ItemConfidence.ANCHORED,
      level: 40,
    },
    {
      inventoryId: null,
      lemma: 'look forward to',
      surface: 'looking forward to',
      confidence: ItemConfidence.CANDIDATE,
      level: 50,
    },
  ]);
}

class StubTranslator implements Translator {
  translate = jest.fn(async (content: FetchedContent) => `[vi] ${content.fullText}`);
}

class StubSourceCache implements SourceCache {
  constructor(private readonly sources: FakeSources) {}
  lookup = jest.fn(async (contentHash: string, normalizedUrl: string | null) => {
    const existing = await this.sources.findByFingerprint(contentHash, normalizedUrl);
    return existing?.id ?? null;
  });
}

class StubCreationCredits implements CreationCreditService {
  private balances = new Map<string, number>();
  grant(ownerId: string, amount: number) {
    this.balances.set(ownerId, amount);
  }
  remaining(ownerId: string) {
    return this.balances.get(ownerId) ?? 0;
  }
  hasCredit = jest.fn(async (ownerId: string) => this.remaining(ownerId) > 0);
  consume = jest.fn(async (ownerId: string) => {
    this.balances.set(ownerId, Math.max(0, this.remaining(ownerId) - 1));
  });
}

// --- Harness -----------------------------------------------------------------

interface Harness {
  engine: LessonCreationEngine;
  sources: FakeSources;
  lessons: FakeLessons;
  items: FakeItems;
  candidateItems: FakeCandidateItems;
  fetcher: StubContentFetcher;
  analyzer: StubAnalyzer;
  grammar: StubGrammarMatcher;
  chunks: StubChunkMatcher;
  translator: StubTranslator;
  cache: StubSourceCache;
  credits: StubCreationCredits;
}

function makeHarness(overrides: Partial<Harness> = {}): Harness {
  const sources = (overrides.sources as FakeSources) ?? new FakeSources();
  const lessons = (overrides.lessons as FakeLessons) ?? new FakeLessons();
  const items = (overrides.items as FakeItems) ?? new FakeItems();
  const candidateItems =
    (overrides.candidateItems as FakeCandidateItems) ?? new FakeCandidateItems();
  const fetcher = overrides.fetcher ?? new StubContentFetcher();
  const analyzer = overrides.analyzer ?? new StubAnalyzer();
  const grammar = overrides.grammar ?? new StubGrammarMatcher();
  const chunks = overrides.chunks ?? new StubChunkMatcher();
  const translator = overrides.translator ?? new StubTranslator();
  const cache = overrides.cache ?? new StubSourceCache(sources);
  const credits = overrides.credits ?? new StubCreationCredits();

  const engine = new LessonCreationEngine(
    sources as unknown as SourcesRepository,
    lessons as unknown as LessonsRepository,
    items as unknown as ItemsRepository,
    candidateItems as unknown as CandidateItemsRepository,
    fetcher,
    analyzer,
    grammar,
    chunks,
    translator,
    cache,
    credits,
  );

  return {
    engine,
    sources,
    lessons,
    items,
    candidateItems,
    fetcher,
    analyzer,
    grammar,
    chunks,
    translator,
    cache,
    credits,
  };
}

const textInput = (text: string, overrides: Partial<SourceInput> = {}): SourceInput => ({
  type: SourceType.TEXT,
  text,
  ...overrides,
});

beforeEach(() => {
  idCounter = 0;
});

// --- Tests -------------------------------------------------------------------

describe('LessonCreationEngine.createLesson', () => {
  it('turns a text Source into a single Lesson with its common core', async () => {
    const h = makeHarness();

    const lessons = await h.engine.createLesson(textInput('She made a decision.'));

    expect(lessons).toHaveLength(1);
    const [lesson] = lessons;
    // Common core: original text + Bilingual Passage live on the Lesson.
    expect(lesson.originalText).toBe('She made a decision.');
    expect(lesson.bilingualPassage).toContain('[vi]');
    // Persisted Source / Lesson / Items / Candidate Items.
    expect(h.sources.rows).toHaveLength(1);
    expect(h.lessons.rows).toHaveLength(1);
    expect(h.candidateItems.rows.length).toBeGreaterThan(0);
    expect(await h.items.findByLessonId(lesson.id)).toHaveLength(h.candidateItems.rows.length);
  });

  it('produces correctly typed Items, counted once each', async () => {
    const h = makeHarness();

    const [lesson] = await h.engine.createLesson(textInput('reluctant negotiate'));
    const lessonItems = await h.items.findByLessonId(lesson.id);

    const byType = (type: ItemType) => lessonItems.filter((i) => i.type === type);
    // Vocabulary, Chunk, Grammar Point all represented.
    expect(
      byType(ItemType.VOCABULARY)
        .map((i) => i.lemma)
        .sort(),
    ).toEqual(['negotiate', 'reluctant']);
    expect(byType(ItemType.GRAMMAR_POINT).map((i) => i.inventoryId)).toEqual([
      'GP_PRESENT_PERFECT',
    ]);
    expect(
      byType(ItemType.CHUNK)
        .map((i) => i.lemma)
        .sort(),
    ).toEqual(['look forward to', 'make a decision']);

    // Counted once each: no duplicate (type, lemma) pair.
    const keys = lessonItems.map((i) => `${i.type}:${i.lemma}`);
    expect(new Set(keys).size).toBe(keys.length);

    // The anchored vs candidate Chunk confidence tiers are preserved (ADR-0004).
    const candidateChunk = byType(ItemType.CHUNK).find((i) => i.lemma === 'look forward to');
    expect(candidateChunk?.confidence).toBe(ItemConfidence.CANDIDATE);
    expect(candidateChunk?.inventoryId).toBeNull();
  });

  it('persists Candidate Items as the shared objective set, linked from Items', async () => {
    const h = makeHarness();

    const [lesson] = await h.engine.createLesson(textInput('a body of text'));

    const source = h.sources.rows[0];
    const candidates = await h.candidateItems.findBySourceId(source.id);
    expect(candidates.length).toBeGreaterThan(0);

    // Every Item back-references a persisted Candidate Item of the same Source.
    const candidateIds = new Set(candidates.map((c) => c.id));
    const lessonItems = await h.items.findByLessonId(lesson.id);
    for (const item of lessonItems) {
      expect(candidateIds.has(item.candidateItemId)).toBe(true);
    }
  });

  it('skips re-analysis on a content-hash cache hit and reuses the existing Lessons', async () => {
    const h = makeHarness();

    const first = await h.engine.createLesson(textInput('identical content here'));
    h.analyzer.analyze.mockClear();
    h.translator.translate.mockClear();

    const second = await h.engine.createLesson(textInput('identical content here'));

    // Cache hit: no re-analysis, no re-translation, no new Source persisted.
    expect(h.analyzer.analyze).not.toHaveBeenCalled();
    expect(h.translator.translate).not.toHaveBeenCalled();
    expect(h.sources.rows).toHaveLength(1);
    expect(second.map((l) => l.id)).toEqual(first.map((l) => l.id));
  });

  it('treats a matching normalized URL as a cache hit (fast path)', async () => {
    const h = makeHarness();

    await h.engine.createLesson({ type: SourceType.ARTICLE, url: 'https://ex.com/post' });
    h.analyzer.analyze.mockClear();

    // Same URL with a trailing slash → normalizes to the same fast-path key.
    await h.engine.createLesson({ type: SourceType.ARTICLE, url: 'https://ex.com/post/' });

    expect(h.analyzer.analyze).not.toHaveBeenCalled();
    expect(h.sources.rows).toHaveLength(1);
  });

  it('does NOT consume a Creation Credit when fetching fails', async () => {
    const credits = new StubCreationCredits();
    credits.grant('owner-1', 3);
    const fetcher = new StubContentFetcher();
    fetcher.fetch.mockRejectedValueOnce(new Error('unfetchable URL'));
    const h = makeHarness({ credits, fetcher });

    await expect(
      h.engine.createLesson(
        { type: SourceType.ARTICLE, url: 'https://bad' },
        { ownerId: 'owner-1' },
      ),
    ).rejects.toThrow();

    expect(credits.consume).not.toHaveBeenCalled();
    expect(credits.remaining('owner-1')).toBe(3);
    expect(h.sources.rows).toHaveLength(0);
  });

  it('consumes exactly one Creation Credit on a successful creation', async () => {
    const credits = new StubCreationCredits();
    credits.grant('owner-1', 3);
    const h = makeHarness({ credits });

    await h.engine.createLesson(textInput('some text'), { ownerId: 'owner-1' });

    expect(credits.consume).toHaveBeenCalledTimes(1);
    expect(credits.remaining('owner-1')).toBe(2);
  });

  it('rejects and persists nothing when the owner has no Creation Credit', async () => {
    const credits = new StubCreationCredits();
    credits.grant('owner-1', 0);
    const h = makeHarness({ credits });

    await expect(
      h.engine.createLesson(textInput('some text'), { ownerId: 'owner-1' }),
    ).rejects.toThrow();

    expect(credits.consume).not.toHaveBeenCalled();
    expect(h.sources.rows).toHaveLength(0);
  });

  it('never marks a private text Source pool-eligible', async () => {
    const h = makeHarness();

    await h.engine.createLesson(textInput('private pasted notes'));

    expect(h.sources.rows[0].type).toBe(SourceType.TEXT);
    expect(h.sources.rows[0].poolEligible).toBe(false);
  });

  it('never marks a private file Source pool-eligible', async () => {
    const h = makeHarness();

    await h.engine.createLesson({ type: SourceType.FILE, text: 'uploaded file contents' });

    expect(h.sources.rows[0].poolEligible).toBe(false);
  });

  it('yields a single Lesson for a short Source', async () => {
    const h = makeHarness();

    const lessons = await h.engine.createLesson(textInput('a short paragraph of text'));

    expect(lessons).toHaveLength(1);
    expect(lessons[0].segmentIndex).toBe(0);
  });

  it('segments a long Source into multiple ~3–5-min Lessons', async () => {
    // durationSeconds derived from word count by the stub fetcher; build a
    // Source far over the 5-min (300s) target so it must segment.
    const longText = Array.from({ length: 900 }, (_, i) => `word${i} ends here.`).join(' ');
    const h = makeHarness();

    const lessons = await h.engine.createLesson(textInput(longText));

    expect(lessons.length).toBeGreaterThan(1);
    // Segments are contiguously indexed from 0.
    expect(lessons.map((l) => l.segmentIndex)).toEqual(lessons.map((_, i) => i));
    // All Lessons belong to the one Source.
    const sourceIds = new Set(lessons.map((l) => l.sourceId));
    expect(sourceIds.size).toBe(1);
  });
});
