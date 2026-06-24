/**
 * Lesson session reducer — the per-learner state machine for one reading pass
 * through a Lesson's Bilingual Passage.
 *
 * Encodes the absorption / completion contract (CONTEXT.md, screens.md §9):
 *
 *   - Tapping an Item is the absorption gesture: it reveals the meaning card AND
 *     marks the Item **Absorbed** (New → Learning) in one step. The first
 *     absorption fires a +1 on the **North Star** (cumulative Absorbed Items —
 *     the headline metric). Re-tapping an already-Absorbed Item re-opens its
 *     card WITHOUT re-incrementing.
 *   - "Biết hết phần còn lại" marks every still-undecided projected Item
 *     **Known** (Item Status New → Known) — these do not touch the North Star.
 *   - **Completion** requires every projected Item to be processed (decided).
 *     Untapped-at-completion Items become **Known**. The North Star increments
 *     only by genuinely Absorbed Items.
 *
 * Personalization only — no shared/derived data lives here (ADR-0001).
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';

/**
 * The learner's decision for a projected Item in this session:
 *   - `absorbed` — tapped (unknown → taken into the personal store); counts
 *     toward the North Star.
 *   - `known`    — left untapped / "Biết hết phần còn lại"; does not count.
 */
export type ItemDecision = 'absorbed' | 'known';

export interface LessonSessionState {
  /** The Lesson being read. `null` before a session starts. */
  lessonId: string | null;
  /** The projected Candidate Item ids that gate completion. */
  projectedItemIds: string[];
  /** Per-Item decision map (only decided Items appear). */
  decided: Record<string, ItemDecision>;
  /** Item id whose meaning card is currently open (null = none). */
  openCardItemId: string | null;
  /** Per-sentence translation reveal flags, keyed by sentence id. */
  revealedSentences: Record<string, boolean>;
  /**
   * The starting North Star value for this session (cumulative Absorbed Items
   * before this Lesson). The live total = base + (# Absorbed this session).
   */
  northStarBase: number;
  /**
   * Monotonic counter bumped on each genuine first-absorption, so the UI can
   * key the "+1" float-up animation without re-firing on re-taps.
   */
  absorbFloatKey: number;
  /** The Item just Absorbed (for the token pop animation); null otherwise. */
  justAbsorbedItemId: string | null;
  /** Whether this session has been completed. */
  completed: boolean;
}

export const initialLessonSessionState: LessonSessionState = {
  lessonId: null,
  projectedItemIds: [],
  decided: {},
  openCardItemId: null,
  revealedSentences: {},
  northStarBase: 0,
  absorbFloatKey: 0,
  justAbsorbedItemId: null,
  completed: false,
};

const lessonSessionSlice = createSlice({
  name: 'lessonSession',
  initialState: initialLessonSessionState,
  reducers: {
    /** Begin a reading session for a Lesson, seeding its projected Items. */
    startSession: (
      state,
      action: PayloadAction<{
        lessonId: string;
        projectedItemIds: string[];
        northStarBase: number;
      }>,
    ) => {
      const {lessonId, projectedItemIds, northStarBase} = action.payload;
      state.lessonId = lessonId;
      state.projectedItemIds = projectedItemIds;
      state.decided = {};
      state.openCardItemId = null;
      state.revealedSentences = {};
      state.northStarBase = northStarBase;
      state.absorbFloatKey = 0;
      state.justAbsorbedItemId = null;
      state.completed = false;
    },

    /**
     * The absorption gesture: tap an Item → open its meaning card and mark it
     * Absorbed. Only the FIRST absorption increments the North Star; re-tapping
     * an already-Absorbed (or Known) Item just re-opens its card.
     */
    tapItem: (state, action: PayloadAction<{itemId: string}>) => {
      const {itemId} = action.payload;
      state.openCardItemId = itemId;

      const prior = state.decided[itemId];
      if (prior === 'absorbed') {
        // Re-tap of an Absorbed Item — re-open card, no re-increment, no float.
        state.justAbsorbedItemId = null;
        return;
      }

      // First absorption (the Item was New or — via re-tap of a "know rest"
      // Item — Known): mark Absorbed and fire the North Star +1 exactly once.
      // `prior` here is `undefined` (New) or `'known'`; either way this is the
      // first time this Item counts toward the North Star.
      state.decided[itemId] = 'absorbed';
      state.absorbFloatKey += 1;
      state.justAbsorbedItemId = itemId;
    },

    /** Close the open meaning card. */
    closeCard: state => {
      state.openCardItemId = null;
      state.justAbsorbedItemId = null;
    },

    /** Reveal / hide one sentence's Native-Language translation. */
    toggleSentenceTranslation: (
      state,
      action: PayloadAction<{sentenceId: string}>,
    ) => {
      const {sentenceId} = action.payload;
      state.revealedSentences[sentenceId] = !state.revealedSentences[sentenceId];
    },

    /**
     * Toggle-all: if any sentence is hidden, reveal all; otherwise hide all
     * (mirrors the handoff's `lpToggleAllSent`).
     */
    toggleAllSentenceTranslations: (
      state,
      action: PayloadAction<{sentenceIds: string[]}>,
    ) => {
      const {sentenceIds} = action.payload;
      const anyHidden = sentenceIds.some(id => !state.revealedSentences[id]);
      const next: Record<string, boolean> = {};
      sentenceIds.forEach(id => {
        next[id] = anyHidden;
      });
      state.revealedSentences = next;
    },

    /**
     * "Biết hết phần còn lại" — mark every still-undecided projected Item as
     * Known. Absorbed Items keep their status; the North Star is untouched.
     */
    markRestKnown: state => {
      state.projectedItemIds.forEach(id => {
        if (!state.decided[id]) {
          state.decided[id] = 'known';
        }
      });
      state.openCardItemId = null;
    },

    /**
     * Complete the session. Completion requires every projected Item to be
     * decided; any still-undecided Item becomes Known at completion (untapped =
     * Known). The North Star already reflects only genuinely Absorbed Items.
     */
    completeSession: state => {
      state.projectedItemIds.forEach(id => {
        if (!state.decided[id]) {
          state.decided[id] = 'known';
        }
      });
      state.completed = true;
      state.openCardItemId = null;
    },
  },
});

// --- Selectors / derivations (pure, reused by UI and tests) ---

/** Count of Items the learner has decided (Absorbed or Known) this session. */
export const countDecided = (state: LessonSessionState): number =>
  state.projectedItemIds.filter(id => state.decided[id] !== undefined).length;

/** Count of genuinely Absorbed Items this session (drives the North Star +N). */
export const countAbsorbed = (state: LessonSessionState): number =>
  state.projectedItemIds.filter(id => state.decided[id] === 'absorbed').length;

/** Number of still-undecided projected Items. */
export const countRemaining = (state: LessonSessionState): number =>
  state.projectedItemIds.length - countDecided(state);

/** Whether every projected Item has been processed (completion gate). */
export const isAllDecided = (state: LessonSessionState): boolean =>
  state.projectedItemIds.length > 0 &&
  state.projectedItemIds.every(id => state.decided[id] !== undefined);

/** The live North Star total = base + Absorbed-this-session. */
export const selectNorthStarLive = (state: LessonSessionState): number =>
  state.northStarBase + countAbsorbed(state);

export const {
  startSession,
  tapItem,
  closeCard,
  toggleSentenceTranslation,
  toggleAllSentenceTranslations,
  markRestKnown,
  completeSession,
} = lessonSessionSlice.actions;

export default lessonSessionSlice.reducer;
