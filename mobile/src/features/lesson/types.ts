/**
 * Lesson Player — Reading domain types.
 *
 * Models the common core of a Lesson (CONTEXT.md → "Lesson"): its Items, a
 * tap-to-reveal Bilingual Passage, and the original text. This slice only
 * covers the Reading Practice Mode (text Sources); Listening Replay layers on
 * later (screens.md §10).
 *
 * ADR-0001 split: an Item here is the per-learner projection of a Candidate
 * Item — the objective, shared derived data (lemma, type, CEFR, meaning) plus
 * what this learner sees as notable. Absorbed status is per-learner and lives
 * in the session reducer, never baked into the Item.
 */

import type {ItemKind} from '@/components/ui/ItemToken';

/** CEFR band shown to the learner; Level is stored finely elsewhere. */
export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * A single learnable thing extracted from a Lesson — exactly one of the three
 * Item types (CONTEXT.md → "Item"). `id` is the stable Candidate Item id used
 * to key per-learner status in the session reducer.
 */
export interface Item {
  /** Stable Candidate Item id (e.g. an Inventory id for Chunks/Grammar Points). */
  id: string;
  /** Which of the three Item types — drives the encoding (ItemToken). */
  type: ItemKind;
  /**
   * Target-Language surface as it should read in the passage (e.g. `give up`).
   * For a Grammar Point this is the Native-Language name of the pattern.
   */
  headword: string;
  /** Native-Language (Vietnamese) meaning shown in the meaning card. */
  meaning: string;
  /** CEFR band of this Item. */
  cefr: CefrBand;
  /** IPA pronunciation (Vocabulary only). */
  ipa?: string;
  /** Part of speech / kind label, e.g. "động từ · B2", "chunk · B1". */
  posLabel: string;
  /** Chunk usage pattern (e.g. "theo sau: V-ing") or Grammar Point pattern. */
  pattern?: string;
  /** Authored Vietnamese explanation for a Grammar Point (ADR-0003). */
  explanation?: string;
  /** The sentence from the passage this Item appears in ("Trong bài"). */
  example: string;
  /**
   * For Chunks (ADR-0004): whether this is a reference-Inventory anchor
   * (stable id) or an LLM-detected novel candidate (lower confidence).
   */
  chunkOrigin?: 'anchor' | 'candidate';
}

/**
 * One inline span of the Bilingual Passage. Either plain reading text, or a
 * reference to an Item (by id) that renders as a tappable token.
 */
export type PassageSpan =
  | {kind: 'text'; text: string}
  | {kind: 'item'; itemId: string};

/**
 * A sentence of the Bilingual Passage: the Target-Language spans plus the
 * Native-Language translation revealed on demand (never side-by-side by
 * default — CONTEXT.md → "Bilingual Passage").
 */
export interface PassageSentence {
  id: string;
  /** Target-Language content, broken into plain text + Item tokens. */
  spans: PassageSpan[];
  /** Native-Language (Vietnamese) translation, revealed per-sentence on tap. */
  translation: string;
}

/** The reading surface of a Lesson. */
export interface BilingualPassage {
  sentences: PassageSentence[];
}

/**
 * A start/end span on the Lesson's audio timeline, in seconds. These are the
 * objective, shared **timestamps** of ADR-0002 — derived data cached in the
 * shared layer (replayable by everyone), distinct from the importer-private
 * transcript text. Both per-sentence and per-Item spans use this shape so the
 * player can replay either granularity (replay a sentence, or replay one Item's
 * audio span).
 */
export interface AudioSpan {
  /** Start time on the audio timeline, in seconds. */
  start: number;
  /** End time on the audio timeline, in seconds. */
  end: number;
}

/** A per-sentence timestamp span, keyed to a `PassageSentence` id. */
export interface SentenceTimestamp extends AudioSpan {
  /** The `PassageSentence.id` this span plays. */
  sentenceId: string;
}

/** A per-Item timestamp span, keyed to an `Item` id (for per-Item replay). */
export interface ItemTimestamp extends AudioSpan {
  /** The `Item.id` whose audio span this is. */
  itemId: string;
}

/**
 * The Listening Replay layer of an audio Lesson (ADR-0002). Carries the bundled
 * audio asset and the shared-layer **timestamps** that let the player play each
 * sentence in turn and replay an individual Item's span. Transcript text is NOT
 * stored here — it is the same Bilingual Passage of the common core, revealed
 * only on demand ("Hiện lời"). Presence of this field marks a Lesson as an
 * audio Source, on which Listening Replay is the Practice Mode (screens.md §10).
 */
export interface LessonAudio {
  /**
   * Reference to the bundled audio asset. A `require(...)` module id for a
   * bundled file, or a remote URL for lazily-aligned user audio. Kept as
   * `unknown` so the domain layer stays decoupled from the audio backend.
   */
  asset: unknown;
  /** Source-type chrome label, e.g. "Podcast · Daily English" (Vietnamese UI). */
  sourceLabel: string;
  /**
   * Which audio Source kind this is — selects the Listening Replay chrome
   * (screens.md §10): a `video` Source (YouTube) shows the "Xem & nghe" watch
   * header + a "CC bật" subtitle pill; a `podcast` Source shows the "Đang nghe"
   * header + a "Transcript" pill. Both share the same Listening Replay body.
   */
  kind: 'video' | 'podcast';
  /**
   * Poster image for the media frame (the video thumbnail / podcast cover).
   * A remote URL or a bundled `require(...)` module id; absent → a flat surface.
   */
  thumbnailUrl?: string;
  /** Total audio duration in seconds (for buffering / end-of-audio handling). */
  durationSec: number;
  /** Per-sentence playback spans, in passage order. */
  sentenceTimestamps: SentenceTimestamp[];
  /** Per-Item playback spans (a subset — only Items present in the audio). */
  itemTimestamps: ItemTimestamp[];
}

/**
 * The kind of comprehension a quiz question probes (screens.md §12; the
 * handoff's `lpQuizData`). Each maps to an authored Vietnamese type label.
 *   - `mainIdea`  — what the passage is mostly about (ý chính);
 *   - `detail`    — a specific fact stated in the passage (chi tiết);
 *   - `inference` — something implied but not stated outright (suy luận).
 */
export type QuizQuestionType = 'mainIdea' | 'detail' | 'inference';

/**
 * One comprehension question of the post-reading Quiz (CONTEXT.md → "Lesson";
 * the optional consolidation that closes a Lesson). Authored alongside the
 * Lesson so it ships bundled with the Golden First Lesson — no backend needed.
 */
export interface QuizQuestion {
  /** Stable question id (keys per-question answer state in the quiz UI). */
  id: string;
  /** Which kind of comprehension this probes — drives the type chip. */
  type: QuizQuestionType;
  /** The question prompt, in the Native Language (Vietnamese). */
  prompt: string;
  /** Answer options, in display order (Native Language). */
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
}

/**
 * A Lesson's common core: its Items + Bilingual Passage + original text.
 * Practice Modes layer on by Source type — Reading runs on the core directly;
 * Listening Replay layers on for audio Sources, keyed off the optional `audio`
 * field (ADR-0002). The field is optional so text-Source Lessons (Reading only)
 * are unchanged. An optional post-reading Quiz (`QuizQuestion[]`) ships bundled
 * with the Lesson.
 */
export interface Lesson {
  id: string;
  /** Display title (Vietnamese chrome shows the English Source title). */
  title: string;
  /** Topic tag (for recommendation/Interest Profile downstream). */
  topic: string;
  /** Reading difficulty band of the Lesson. */
  cefr: CefrBand;
  /** The projected Candidate Items the learner must process to complete. */
  items: Item[];
  passage: BilingualPassage;
  /**
   * Listening Replay layer — present only for audio Sources (podcast, video,
   * narrated text). When set, the Lesson Player offers the Listening Replay
   * Practice Mode (screens.md §10). Absent → Reading-only.
   */
  audio?: LessonAudio;
}
