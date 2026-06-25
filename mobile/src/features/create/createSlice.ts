/**
 * Create-tab reducer — the state of turning a Source into a Lesson (issue #12,
 * screens.md §13).
 *
 * Owns:
 *   - the learner's **Creation Credit** balance, shown before creating
 *     (CONTEXT.md "Creation Credit"); a failed creation never spends one;
 *   - the in-flight creation phase (idle → processing → ready / async / error);
 *   - the kind error state and the hybrid-async job stub.
 *
 * Credits are persisted (whitelisted in the store) so the monthly allowance
 * survives relaunch until the real backend balance endpoint exists.
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {LessonCreationErrorCode} from './types';

/** The creation lifecycle phase rendered by the Create screen. */
export type CreationPhase =
  | 'idle' // composing — empty or filled input
  | 'processing' // staged pipeline transition (ADR-0005)
  | 'ready' // Lesson(s) finished inline → open in the Player
  | 'async' // long Source queued → "we'll notify you when ready"
  | 'error'; // kind failure — no Credit consumed

export interface CreateState {
  /** Remaining Creation Credits this month (Free Plan monthly allowance). */
  creditsRemaining: number;
  /** Total monthly Creation Credit allowance (for the "3/5" display). */
  creditsTotal: number;
  phase: CreationPhase;
  /** The created Lesson id to open in the Player (set on `ready`). */
  createdLessonId: string | null;
  /** The async job handle (set on `async`). */
  jobId: string | null;
  /** The error code on a failed creation (set on `error`). */
  errorCode: LessonCreationErrorCode | null;
}

const initialState: CreateState = {
  // Free Plan default: 3 of 5 remaining (matches design 13a/13b's
  // "●●●○○ 3/5" Credit indicator until Home/Profile owns the balance).
  creditsRemaining: 3,
  creditsTotal: 5,
  phase: 'idle',
  createdLessonId: null,
  jobId: null,
  errorCode: null,
};

const createTabSlice = createSlice({
  name: 'create',
  initialState,
  reducers: {
    /** Enter the processing transition (the staged pipeline begins). */
    creationStarted: state => {
      state.phase = 'processing';
      state.createdLessonId = null;
      state.jobId = null;
      state.errorCode = null;
    },

    /**
     * Inline success: Lesson(s) ready. Consume exactly one Creation Credit
     * (only ever called on success — a failed creation never charges).
     */
    creationSucceeded: (state, action: PayloadAction<{lessonId: string}>) => {
      state.phase = 'ready';
      state.createdLessonId = action.payload.lessonId;
      state.creditsRemaining = Math.max(0, state.creditsRemaining - 1);
    },

    /**
     * Long Source queued (hybrid-async, ADR-0002). A Credit is still consumed —
     * the learner will get the Lesson they paid for, just later — and they are
     * notified when it is ready.
     */
    creationQueuedAsync: (state, action: PayloadAction<{jobId: string}>) => {
      state.phase = 'async';
      state.jobId = action.payload.jobId;
      state.creditsRemaining = Math.max(0, state.creditsRemaining - 1);
    },

    /** Kind failure. No Credit is consumed. */
    creationFailed: (
      state,
      action: PayloadAction<{code: LessonCreationErrorCode}>,
    ) => {
      state.phase = 'error';
      state.errorCode = action.payload.code;
    },

    /** Return to the composer (after error dismiss / async ack / retry). */
    creationReset: state => {
      state.phase = 'idle';
      state.createdLessonId = null;
      state.jobId = null;
      state.errorCode = null;
    },
  },
});

// --- Selectors ---

export const selectCreditsRemaining = (s: {create: CreateState}): number =>
  s.create.creditsRemaining;

export const selectHasCredit = (s: {create: CreateState}): boolean =>
  s.create.creditsRemaining > 0;

export const {
  creationStarted,
  creationSucceeded,
  creationQueuedAsync,
  creationFailed,
  creationReset,
} = createTabSlice.actions;

export default createTabSlice.reducer;
