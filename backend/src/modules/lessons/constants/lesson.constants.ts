/**
 * Domain constants for the Lesson Creation Engine.
 *
 * Terms are used verbatim from CONTEXT.md — Source, Lesson, Item, Vocabulary,
 * Chunk, Grammar Point, Candidate Item — and must not be renamed.
 */

/**
 * The type of a {@link SourceEntity}. A Source is the raw original content a
 * Lesson is built from (CONTEXT.md → Source).
 *
 * `ARTICLE` / `YOUTUBE` / `PODCAST` are public-URL Sources (shareable derived
 * layer, ADR-0001). `TEXT` / `FILE` are private pasted/uploaded Sources that
 * stay strictly per-importer and are never pool-eligible.
 */
export enum SourceType {
  TEXT = 'text',
  ARTICLE = 'article',
  YOUTUBE = 'youtube',
  PODCAST = 'podcast',
  FILE = 'file',
}

/**
 * Public-URL Source types whose derived layer is shareable (ADR-0001). Private
 * text/file Sources are intentionally excluded so they never become
 * pool-eligible.
 */
export const PUBLIC_SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  SourceType.ARTICLE,
  SourceType.YOUTUBE,
  SourceType.PODCAST,
]);

/**
 * The three — and only three — Item types (CONTEXT.md → Item). Every Item is
 * exactly one of these and is counted once.
 */
export enum ItemType {
  VOCABULARY = 'vocabulary',
  CHUNK = 'chunk',
  GRAMMAR_POINT = 'grammar_point',
}

/**
 * Confidence tier of a Candidate Item. An `ANCHORED` Item matched a reference
 * Inventory (stable ID); a `CANDIDATE` Item is an LLM-detected novel
 * collocation kept at lower confidence (ADR-0004). Vocabulary and Grammar
 * Points are always `ANCHORED` (Grammar is a closed Inventory, ADR-0003).
 */
export enum ItemConfidence {
  ANCHORED = 'anchored',
  CANDIDATE = 'candidate',
}

/**
 * Target Lesson length in seconds. A Source is auto-segmented into multiple
 * Lessons only when it exceeds the ~3–5 minute target (CONTEXT.md → Relationships).
 */
export const LESSON_TARGET_SECONDS = 5 * 60; // 5 minutes

/**
 * Reading speed used to estimate a text Source's duration when no duration is
 * supplied. ~200 words per minute is a typical adult silent reading rate.
 */
export const WORDS_PER_MINUTE = 200;
