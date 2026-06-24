import { Inject, Injectable, Logger } from '@nestjs/common';

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

import { ItemConfidence, ItemType, PUBLIC_SOURCE_TYPES } from '../constants/lesson.constants';
import { LessonEngineErrors } from '../lessons.errors';
import {
  ANALYZER,
  Analyzer,
  AnalyzedItem,
  AnalyzedMetadata,
  CHUNK_MATCHER,
  CONTENT_FETCHER,
  CREATION_CREDIT_SERVICE,
  ChunkMatcher,
  ContentFetcher,
  CreationCreditService,
  FetchedContent,
  GRAMMAR_MATCHER,
  GrammarMatcher,
  SOURCE_CACHE,
  SourceCache,
  SourceInput,
  TRANSLATOR,
  Translator,
} from '../ports/lesson-engine.ports';
import { hashContent } from '../utils/source-fingerprint.util';
import { segmentSource } from '../utils/segment-source.util';

/** Optional context for a creation — the importer and whether this is curated. */
export interface CreateLessonContext {
  /** The learner / admin importing the Source; charged a Creation Credit on success. */
  ownerId?: string;
}

/**
 * The Lesson Creation Engine (issue #3) — the use-case that turns a Source into
 * Lessons. It is the primary backend seam and the curated-content production
 * line: the team produces curated content by running this same engine.
 *
 * `createLesson(SourceInput) -> Lesson[]` runs a **staged pipeline** (ADR-0005),
 * never one monolithic LLM call:
 *
 *   1. INGEST       — fetch + normalize the Source, derive the hybrid fingerprint
 *   2. CACHE CHECK  — a matching fingerprint (URL or content-hash) is a cache hit
 *   3. ANALYZE      — cheap Vocabulary/metadata + Grammar + Chunk stages
 *   4. TRANSLATE    — the expensive Bilingual Passage stage
 *   5. SEGMENT      — split into ~3–5-min Lessons
 *   6. ASSEMBLE     — persist Source / CandidateItem / Lesson / Item
 *
 * Every external dependency is a port (ContentFetcher, Analyzer, GrammarMatcher,
 * ChunkMatcher, Translator, SourceCache, CreationCreditService) injected by
 * token, so adapters are faked in tests and the engine asserts only external
 * behavior at this seam.
 */
@Injectable()
export class LessonCreationEngine {
  private readonly logger = new Logger(LessonCreationEngine.name);

  constructor(
    private readonly sources: SourcesRepository,
    private readonly lessons: LessonsRepository,
    private readonly items: ItemsRepository,
    private readonly candidateItems: CandidateItemsRepository,
    @Inject(CONTENT_FETCHER) private readonly contentFetcher: ContentFetcher,
    @Inject(ANALYZER) private readonly analyzer: Analyzer,
    @Inject(GRAMMAR_MATCHER) private readonly grammarMatcher: GrammarMatcher,
    @Inject(CHUNK_MATCHER) private readonly chunkMatcher: ChunkMatcher,
    @Inject(TRANSLATOR) private readonly translator: Translator,
    @Inject(SOURCE_CACHE) private readonly sourceCache: SourceCache,
    @Inject(CREATION_CREDIT_SERVICE) private readonly creationCredits: CreationCreditService,
  ) {}

  /**
   * Turn a Source into one or more Lessons. Returns the Lessons in segment
   * order. On any failure the method throws before a Creation Credit is
   * committed — a failed creation never consumes a Credit.
   */
  async createLesson(
    input: SourceInput,
    context: CreateLessonContext = {},
  ): Promise<LessonEntity[]> {
    const { ownerId } = context;

    // Fail fast if the importer has no Creation Credit — but do not consume it
    // yet; the credit is committed only after a Lesson is actually produced.
    if (ownerId && !(await this.creationCredits.hasCredit(ownerId))) {
      throw LessonEngineErrors.NO_CREATION_CREDIT();
    }

    // --- Stage 1: INGEST -----------------------------------------------------
    const content = await this.ingest(input);
    const contentHash = hashContent(content.fullText);
    const normalizedUrl = content.normalizedUrl;

    // --- Stage 2: CACHE CHECK ------------------------------------------------
    // A matching hybrid fingerprint (normalized-URL or content-hash) is a cache
    // hit: the shared derived layer already exists, so skip re-analysis and
    // serve the existing Lessons (ADR-0001 / ADR-0005).
    const cachedSourceId = await this.sourceCache.lookup(contentHash, normalizedUrl);
    if (cachedSourceId) {
      this.logger.debug(`Cache hit for Source ${cachedSourceId}; skipping re-analysis`);
      const lessons = await this.lessons.findBySourceId(cachedSourceId);
      if (ownerId) {
        await this.creationCredits.consume(ownerId);
      }
      return lessons;
    }

    // --- Stage 3: ANALYZE (staged, not monolithic — ADR-0005) ----------------
    const { items: analyzed, metadata } = await this.analyze(content);

    // --- Stage 4: TRANSLATE (expensive, private layer — ADR-0001/0005) -------
    const bilingualPassage = await this.translator.translate(content);

    // --- Stages 5 & 6: SEGMENT + ASSEMBLE ------------------------------------
    const lessons = await this.assemble(
      input,
      content,
      contentHash,
      analyzed,
      metadata,
      bilingualPassage,
    );

    // The Lesson(s) now exist — commit the Creation Credit.
    if (ownerId) {
      await this.creationCredits.consume(ownerId);
    }

    return lessons;
  }

  /** Stage 1: fetch + normalize the Source. A fetch failure aborts the run. */
  private async ingest(input: SourceInput): Promise<FetchedContent> {
    try {
      const content = await this.contentFetcher.fetch(input);
      if (!content?.fullText?.trim()) {
        throw LessonEngineErrors.CONTENT_UNFETCHABLE();
      }
      return content;
    } catch (error) {
      this.logger.warn(`Ingest failed: ${(error as Error).message}`);
      throw LessonEngineErrors.CONTENT_UNFETCHABLE();
    }
  }

  /**
   * Stage 3: run the analyze sub-stages and merge them into the deduped Item
   * set. Each Item is exactly one type and counted once (CONTEXT.md dedup rule):
   * Chunk and Grammar matches take precedence so a word inside a matched
   * Chunk/Grammar Point is not also counted as Vocabulary.
   */
  private async analyze(
    content: FetchedContent,
  ): Promise<{ items: AnalyzedItem[]; metadata: AnalyzedMetadata }> {
    let vocabulary: AnalyzedItem[];
    let grammar: AnalyzedItem[];
    let chunks: AnalyzedItem[];
    let metadata: AnalyzedMetadata;
    try {
      const [analysis, grammarMatches, chunkMatches] = await Promise.all([
        this.analyzer.analyze(content),
        this.grammarMatcher.match(content),
        this.chunkMatcher.match(content),
      ]);

      metadata = analysis.metadata;
      vocabulary = analysis.vocabulary.map((v) => ({
        type: ItemType.VOCABULARY,
        lemma: v.lemma,
        surface: v.surface,
        inventoryId: null,
        confidence: ItemConfidence.ANCHORED,
        level: v.level,
      }));
      grammar = grammarMatches.map((g) => ({
        type: ItemType.GRAMMAR_POINT,
        lemma: g.lemma,
        surface: g.surface,
        inventoryId: g.inventoryId,
        confidence: ItemConfidence.ANCHORED,
        level: g.level,
      }));
      chunks = chunkMatches.map((c) => ({
        type: ItemType.CHUNK,
        lemma: c.lemma,
        surface: c.surface,
        inventoryId: c.inventoryId,
        confidence: c.confidence,
        level: c.level,
      }));
    } catch (error) {
      this.logger.warn(`Analyze failed: ${(error as Error).message}`);
      throw LessonEngineErrors.ANALYSIS_FAILED();
    }

    return { items: this.dedupe([...grammar, ...chunks, ...vocabulary]), metadata };
  }

  /**
   * Apply the dedup rule (CONTEXT.md): each Item belongs to exactly one type and
   * is counted once. Keyed by (type, lemma); Vocabulary whose lemma is already
   * covered by a Chunk/Grammar Point surface is dropped so it is not double-counted.
   */
  private dedupe(itemsList: AnalyzedItem[]): AnalyzedItem[] {
    const byKey = new Map<string, AnalyzedItem>();
    const coveredWords = new Set<string>();

    for (const item of itemsList) {
      if (item.type !== ItemType.VOCABULARY) {
        // Record every word that appears inside a Chunk / Grammar Point surface.
        for (const word of item.surface.toLowerCase().split(/\s+/)) {
          coveredWords.add(word);
        }
      }
    }

    for (const item of itemsList) {
      if (item.type === ItemType.VOCABULARY && coveredWords.has(item.lemma.toLowerCase())) {
        continue; // already counted as part of a Chunk / Grammar Point
      }
      const key = `${item.type}:${item.lemma.toLowerCase()}`;
      if (!byKey.has(key)) {
        byKey.set(key, item);
      }
    }

    return [...byKey.values()];
  }

  /**
   * Stages 5 & 6: persist the Source + its shared Candidate Item set, segment
   * the text into ~3–5-min Lessons, and persist each Lesson with its Items.
   */
  private async assemble(
    input: SourceInput,
    content: FetchedContent,
    contentHash: string,
    analyzed: AnalyzedItem[],
    metadata: AnalyzedMetadata,
    bilingualPassage: string,
  ): Promise<LessonEntity[]> {
    // Pool eligibility (ADR-0001): private text/file Sources are *never*
    // pool-eligible. Public-URL Sources are only promoted into the shared pool
    // later by a moderation + broad-value gate, so even they start ineligible.
    // The hard rule this slice enforces: a private Source can never be eligible.
    const isPublic = PUBLIC_SOURCE_TYPES.has(input.type);
    const poolEligible = isPublic && false;

    const source = await this.sources.save(
      this.sources.create({
        type: input.type,
        title: content.title,
        normalizedUrl: content.normalizedUrl,
        contentHash,
        language: content.language,
        durationSeconds: content.durationSeconds,
        topic: metadata.topic,
        author: metadata.author,
        poolEligible,
      } satisfies Partial<SourceEntity>),
    );

    // Shared objective Candidate Item set (ADR-0001) — extracted once per Source.
    const candidates = await Promise.all(
      analyzed.map((item) =>
        this.candidateItems.save(
          this.candidateItems.create({
            sourceId: source.id,
            type: item.type,
            lemma: item.lemma,
            surface: item.surface,
            inventoryId: item.inventoryId,
            confidence: item.confidence,
            level: item.level,
          } satisfies Partial<CandidateItemEntity>),
        ),
      ),
    );

    // Segment into ~3–5-min Lessons (single Lesson for short Sources).
    const segments = segmentSource(content.fullText, content.durationSeconds);
    const passageSegments = segmentSource(bilingualPassage, content.durationSeconds);

    const lessons: LessonEntity[] = [];
    for (const segment of segments) {
      const lesson = await this.lessons.save(
        this.lessons.create({
          sourceId: source.id,
          title: content.title,
          segmentIndex: segment.segmentIndex,
          durationSeconds: segment.durationSeconds,
          originalText: segment.text,
          bilingualPassage: passageSegments[segment.segmentIndex]?.text ?? bilingualPassage,
        } satisfies Partial<LessonEntity>),
      );

      // Each Lesson's common core = its Items, projected from the Candidate
      // Item set. In this thin slice every Candidate Item appears in every
      // segment's common core; a per-segment offset map is deferred.
      await Promise.all(
        candidates.map((candidate) =>
          this.items.save(
            this.items.create({
              lessonId: lesson.id,
              candidateItemId: candidate.id,
              type: candidate.type,
              lemma: candidate.lemma,
              surface: candidate.surface,
              inventoryId: candidate.inventoryId,
              confidence: candidate.confidence,
              level: candidate.level,
            } satisfies Partial<ItemEntity>),
          ),
        ),
      );

      lessons.push(lesson);
    }

    return lessons;
  }
}
