/**
 * Lesson-creation domain types — the mobile mirror of the backend Lesson
 * Creation Engine contract (issue #3, commit 7bb21ef). The engine's seam is
 * `createLesson(input: SourceInput, ctx) -> Lesson[]`; the Create tab (issue
 * #12) drives it.
 *
 * Terms are the glossary's exact terms (CONTEXT.md): Source, Lesson,
 * Creation Credit, Item.
 */

/**
 * Source type — mirrors the backend `SourceType` enum
 * (backend/src/modules/lessons/constants/lesson.constants.ts). A Source is the
 * raw original content a Lesson is built from.
 */
export enum SourceType {
  TEXT = 'text',
  ARTICLE = 'article',
  YOUTUBE = 'youtube',
  PODCAST = 'podcast',
  FILE = 'file',
}

/** The three input modes the Create screen offers (screens.md §13). */
export type CreateMode = 'link' | 'text' | 'file';

/** A picked file to upload as a Source (private, "only you"). */
export interface PickedFile {
  name: string;
  uri: string;
  mimeType?: string;
}

/**
 * The request body the createLesson endpoint accepts — mirrors the backend
 * `SourceInput` (backend/src/modules/lessons/ports/lesson-engine.ports.ts).
 * For a pasted link set `type` + `url`; for pasted text set `type='text'` +
 * `text`; for an uploaded file set `type='file'` + `file`.
 */
export interface SourceInput {
  type: SourceType;
  /** Public-URL Sources (article/youtube/podcast). Absent for text/file. */
  url?: string;
  /** Pasted TEXT Source. Absent for URL Sources. */
  text?: string;
  /** Uploaded file Source — uploaded as multipart by the transport. */
  file?: PickedFile;
  title?: string;
  language?: string;
}

/**
 * A Lesson as returned by createLesson — mirrors the backend `LessonEntity`
 * (backend/src/database/postgres/entities/lesson.entity.ts). The engine returns
 * a `Lesson[]` (one per segment for long Sources).
 *
 * `originalText` / `bilingualPassage` are importer-private (ADR-0001).
 */
export interface Lesson {
  id: string;
  sourceId: string;
  title: string | null;
  segmentIndex: number;
  durationSeconds: number;
  originalText?: string;
  bilingualPassage?: string;
}

/**
 * createLesson outcome. A long Source (e.g. podcast ASR) processes
 * hybrid-async (CONTEXT.md "Relationships"; ADR-0002): the request returns a
 * job handle rather than finished Lessons, and the learner is notified when
 * ready. Short / cache-hit Sources finish inline and return `lessons`.
 */
export type CreateLessonResult =
  | {status: 'ready'; lessons: Lesson[]}
  | {status: 'processing'; jobId: string};

/**
 * Error codes the engine raises — mirrors backend lessons.errors.ts. A failed
 * creation never consumes a Creation Credit (CONTEXT.md "Creation Credit").
 */
export enum LessonCreationErrorCode {
  CONTENT_UNFETCHABLE = 'LESSON_CONTENT_UNFETCHABLE',
  ANALYSIS_FAILED = 'LESSON_ANALYSIS_FAILED',
  NO_CREATION_CREDIT = 'LESSON_NO_CREATION_CREDIT',
  MODERATION_REJECTED = 'LESSON_MODERATION_REJECTED',
  UNKNOWN = 'LESSON_UNKNOWN_ERROR',
}

export class LessonCreationError extends Error {
  constructor(
    public readonly code: LessonCreationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LessonCreationError';
  }
}

/**
 * The staged pipeline shown during processing (screens.md §13; ADR-0005).
 * The transition animates through these stages so the wait feels like real
 * progress, not a spinner.
 */
export type CreationStageKey =
  | 'fetch' // ✓ Lấy nội dung
  | 'analyze' // ✓ Tìm từ·chunk·NP
  | 'translate' // ⏳ Dịch song ngữ
  | 'audio'; // ○ (audio) chuẩn bị nghe

export type CreationStageStatus = 'pending' | 'active' | 'done';
