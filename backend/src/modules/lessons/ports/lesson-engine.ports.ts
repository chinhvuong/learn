/**
 * Ports for the Lesson Creation Engine — the external seams the staged pipeline
 * (ADR-0005) talks to. Each is an interface plus a Nest injection token so real
 * adapters (LLM, ASR, fetchers, caches) can be swapped in later and faked in
 * tests. The engine never depends on a concrete adapter.
 */

import { ItemConfidence, ItemType, SourceType } from '../constants/lesson.constants';

/** The input to {@link LessonCreationEngine.createLesson}: a Source to import. */
export interface SourceInput {
  type: SourceType;
  /** Raw URL for public-URL Sources; absent for pasted-text/file Sources. */
  url?: string;
  /** Pasted text for a TEXT Source; absent for URL Sources (fetched instead). */
  text?: string;
  title?: string;
  language?: string;
}

/**
 * The normalized, fetched content of a Source. `fullText` is the
 * importer-private original (ADR-0001). `normalizedUrl` is the fast-path
 * identity half; the engine derives the authoritative content-hash itself.
 */
export interface FetchedContent {
  type: SourceType;
  title: string | null;
  normalizedUrl: string | null;
  fullText: string;
  language: string;
  /** Estimated duration in seconds; drives Lesson segmentation. */
  durationSeconds: number;
}

/**
 * Port: turns a {@link SourceInput} into normalized {@link FetchedContent}.
 * Real adapters fetch articles / extract YouTube transcripts / read uploads;
 * for pasted text it just normalizes. A fetch failure throws — the engine then
 * consumes no Creation Credit (CONTEXT.md → Creation Credit).
 */
export interface ContentFetcher {
  fetch(input: SourceInput): Promise<FetchedContent>;
}
export const CONTENT_FETCHER = Symbol('ContentFetcher');

/** A Vocabulary Candidate Item produced by the cheap analyze stage (ADR-0005). */
export interface AnalyzedVocabulary {
  lemma: string;
  surface: string;
  level: number | null;
}

/** Shared derived metadata produced by the cheap analyze stage. */
export interface AnalyzedMetadata {
  topic: string | null;
  author: string | null;
}

/**
 * Port: the cheap, no-reference ANALYZE stage (ADR-0005) — sentence splitting,
 * Vocabulary extraction, and topic/author metadata, batched into one call.
 * Grammar and Chunk detection are separate ports because they need an Inventory.
 */
export interface Analyzer {
  analyze(content: FetchedContent): Promise<{
    vocabulary: AnalyzedVocabulary[];
    metadata: AnalyzedMetadata;
  }>;
}
export const ANALYZER = Symbol('Analyzer');

/**
 * A Grammar Point match — a classification against the closed Grammar Inventory
 * (ADR-0003). `inventoryId` is the stable Inventory entry id; the engine never
 * generates free-form grammar.
 */
export interface GrammarMatch {
  inventoryId: string;
  lemma: string;
  surface: string;
  level: number | null;
}

/** Port: classifies a Source's sentences against the Grammar Inventory (ADR-0003). */
export interface GrammarMatcher {
  match(content: FetchedContent): Promise<GrammarMatch[]>;
}
export const GRAMMAR_MATCHER = Symbol('GrammarMatcher');

/**
 * A Chunk match (ADR-0004). Anchored Chunks carry an `inventoryId`; LLM-detected
 * candidates have a null `inventoryId` and `CANDIDATE` confidence. Every Chunk
 * carries its canonical lemmatized form.
 */
export interface ChunkMatch {
  inventoryId: string | null;
  /** Canonical lemmatized form — mandatory (ADR-0004). */
  lemma: string;
  surface: string;
  confidence: ItemConfidence;
  level: number | null;
}

/** Port: hybrid Chunk detection — reference Inventory + novel candidates (ADR-0004). */
export interface ChunkMatcher {
  match(content: FetchedContent): Promise<ChunkMatch[]>;
}
export const CHUNK_MATCHER = Symbol('ChunkMatcher');

/**
 * Port: the expensive bilingual TRANSLATE stage (ADR-0005). Produces the
 * Bilingual Passage; cached separately in the importer-private layer (ADR-0001).
 */
export interface Translator {
  translate(content: FetchedContent): Promise<string>;
}
export const TRANSLATOR = Symbol('Translator');

/** A type usable as either an Item or a Candidate Item (shared analyzed shape). */
export interface AnalyzedItem {
  type: ItemType;
  lemma: string;
  surface: string;
  inventoryId: string | null;
  confidence: ItemConfidence;
  level: number | null;
}

/**
 * Port: the shared derived-layer cache (ADR-0001). The CACHE-CHECK stage asks
 * it whether a Source fingerprint is already analyzed; the engine records the
 * analyzed derived layer after a fresh analysis. A hit skips re-analysis.
 *
 * Persistence of the derived layer is the SourceCache's job; the fake keeps it
 * in memory, a real adapter reads/writes the `sources` + `candidate_items`
 * tables (or Redis in front of them).
 */
export interface SourceCache {
  /** Returns the cached Source id for a matching fingerprint, or null. */
  lookup(contentHash: string, normalizedUrl: string | null): Promise<string | null>;
}
export const SOURCE_CACHE = Symbol('SourceCache');

/**
 * Port: the learner's Creation Credit allowance (CONTEXT.md → Creation Credit).
 * The engine checks availability up front but **commits** a credit only after a
 * Lesson is actually produced — a failed creation never consumes a Credit.
 */
export interface CreationCreditService {
  hasCredit(ownerId: string): Promise<boolean>;
  /** Commit one Creation Credit. Called only on a successful creation. */
  consume(ownerId: string): Promise<void>;
}
export const CREATION_CREDIT_SERVICE = Symbol('CreationCreditService');
