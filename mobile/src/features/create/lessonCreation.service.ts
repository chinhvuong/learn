/**
 * Lesson-creation API client — the mobile call into the backend Lesson Creation
 * Engine (`createLesson`, issue #3). Turns a Source into a Lesson (or Lessons).
 *
 * Transport note: the backend tracer (commit 7bb21ef) implements `createLesson`
 * as a service-layer use-case with NO HTTP endpoint yet — there is no
 * `POST /api/v1/lessons` route to reach. Per issue #12 we wire to the REAL
 * client (`apiService`) against the conventional route + the engine's real
 * request/response shapes, and STUB THE TRANSPORT at this boundary behind
 * `USE_STUB_TRANSPORT`. When the backend endpoint lands, flip the flag (or read
 * it from config) and the screen logic above is unchanged.
 */

import {apiService} from '@/services/api.service';
import {
  CreateLessonResult,
  Lesson,
  LessonCreationError,
  LessonCreationErrorCode,
  SourceInput,
  SourceType,
} from './types';

/**
 * The conventional create-Lesson endpoint under the backend's `/api/v1` global
 * prefix (backend/src/bootstrap/api/main.ts). Not yet routed on the backend
 * tracer — see the transport note above.
 */
const CREATE_LESSON_ENDPOINT = '/api/v1/lessons';

/**
 * While the backend endpoint does not exist, run the call through a local stub
 * that honours the real engine contract (returns `Lesson[]`, raises the real
 * error codes, and routes long audio Sources to the async path). Flip to
 * `false` once `POST /api/v1/lessons` is live.
 */
const USE_STUB_TRANSPORT = true;

/** Wire shape of a created Lesson row from the API (`LessonEntity`). */
interface LessonDto {
  id: string;
  sourceId: string;
  title: string | null;
  segmentIndex: number;
  durationSeconds: number;
  originalText?: string;
  bilingualPassage?: string;
}

interface CreateLessonResponseDto {
  status: 'ready' | 'processing';
  lessons?: LessonDto[];
  jobId?: string;
}

/** A long Source (podcast/YouTube audio) goes hybrid-async (ADR-0002). */
function isLongAsyncSource(input: SourceInput): boolean {
  return input.type === SourceType.PODCAST || input.type === SourceType.YOUTUBE;
}

/**
 * Call the Lesson Creation Engine. Resolves to either finished Lessons
 * (inline / cache-hit) or a job handle (long audio, hybrid-async). Rejects with
 * a {@link LessonCreationError} carrying the engine's error code — a failed
 * creation never consumes a Creation Credit (CONTEXT.md "Creation Credit").
 */
export async function createLesson(
  input: SourceInput,
): Promise<CreateLessonResult> {
  if (USE_STUB_TRANSPORT) {
    return stubCreateLesson(input);
  }

  try {
    const res = await apiService.post<CreateLessonResponseDto>(
      CREATE_LESSON_ENDPOINT,
      input,
    );
    if (res.status === 'processing') {
      return {status: 'processing', jobId: res.jobId ?? 'unknown-job'};
    }
    return {status: 'ready', lessons: (res.lessons ?? []) as Lesson[]};
  } catch (error) {
    throw toLessonCreationError(error);
  }
}

/** Map an unknown transport error onto an engine error code. */
function toLessonCreationError(error: unknown): LessonCreationError {
  const message = error instanceof Error ? error.message : String(error);
  // The backend serialises `{ error: { code } }`; the fetch wrapper currently
  // only surfaces the HTTP status string, so fall back to UNKNOWN.
  for (const code of Object.values(LessonCreationErrorCode)) {
    if (message.includes(code)) {
      return new LessonCreationError(code, message);
    }
  }
  return new LessonCreationError(LessonCreationErrorCode.UNKNOWN, message);
}

// --- Stub transport (removed once the backend endpoint exists) ---

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let stubLessonSeq = 0;

/**
 * A faithful in-app stand-in for the engine over the network: it exercises
 * every real branch the screen must handle — inline success, the async audio
 * path, and the kind-error path — using deterministic triggers so the states
 * are demonstrable without a backend.
 *
 * Triggers (in the URL / text):
 *   - contains "fail"   → CONTENT_UNFETCHABLE (kind error, no Credit charged)
 *   - contains "nsfw"   → MODERATION_REJECTED
 *   - podcast / youtube → async "we'll notify you" job
 *   - otherwise         → inline ready Lesson
 */
async function stubCreateLesson(
  input: SourceInput,
): Promise<CreateLessonResult> {
  const haystack = `${input.url ?? ''} ${input.text ?? ''} ${
    input.file?.name ?? ''
  }`.toLowerCase();

  await delay(1200); // let the staged-pipeline transition play through

  if (haystack.includes('fail')) {
    throw new LessonCreationError(
      LessonCreationErrorCode.CONTENT_UNFETCHABLE,
      'Could not fetch the Source content.',
    );
  }
  if (haystack.includes('nsfw')) {
    throw new LessonCreationError(
      LessonCreationErrorCode.MODERATION_REJECTED,
      'Source rejected by moderation.',
    );
  }

  if (isLongAsyncSource(input)) {
    return {status: 'processing', jobId: `stub-job-${Date.now()}`};
  }

  stubLessonSeq += 1;
  const lesson: Lesson = {
    id: `stub-lesson-${stubLessonSeq}`,
    sourceId: `stub-source-${stubLessonSeq}`,
    title: input.title ?? deriveTitle(input),
    segmentIndex: 0,
    durationSeconds: 240,
  };
  return {status: 'ready', lessons: [lesson]};
}

function deriveTitle(input: SourceInput): string {
  if (input.type === SourceType.TEXT) return 'Văn bản của bạn';
  if (input.file) return input.file.name;
  if (input.url) {
    const host = input.url.match(/^https?:\/\/(?:www\.)?([^/]+)/i);
    return host ? host[1] : input.url;
  }
  return 'Bài học mới';
}
