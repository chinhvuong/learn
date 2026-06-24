/**
 * Behavior tests over the Lesson session reducer — the absorption / completion
 * / North-Star contract (CONTEXT.md, PRD stories 17–19, screens.md §9).
 *
 * These assert the rules called out in the issue's acceptance criteria:
 *   - tapping an Item marks it Absorbed (New → Learning);
 *   - the North Star increments only by genuinely Absorbed Items, and re-taps
 *     never re-increment;
 *   - "Biết hết phần còn lại" marks remaining Items Known;
 *   - completion requires all projected Items processed; untapped Items become
 *     Known at completion.
 */

import reducer, {
  closeCard,
  completeSession,
  countAbsorbed,
  countDecided,
  countRemaining,
  initialLessonSessionState,
  isAllDecided,
  markRestKnown,
  selectNorthStarLive,
  startSession,
  tapItem,
  toggleAllSentenceTranslations,
  toggleSentenceTranslation,
  type LessonSessionState,
} from './lessonSessionSlice';

const PROJECTED = ['reshaping', 'adopt', 'giveup', 'lookfwd', 'cond', 'reluctant'];
const NS_BASE = 1228;

const startState = (): LessonSessionState =>
  reducer(
    initialLessonSessionState,
    startSession({
      lessonId: 'golden-first-lesson',
      projectedItemIds: PROJECTED,
      northStarBase: NS_BASE,
    }),
  );

describe('lessonSession reducer — startSession', () => {
  it('seeds the projected Items and North Star base, with nothing decided', () => {
    const s = startState();
    expect(s.lessonId).toBe('golden-first-lesson');
    expect(s.projectedItemIds).toEqual(PROJECTED);
    expect(s.northStarBase).toBe(NS_BASE);
    expect(countDecided(s)).toBe(0);
    expect(countAbsorbed(s)).toBe(0);
    expect(isAllDecided(s)).toBe(false);
    expect(selectNorthStarLive(s)).toBe(NS_BASE);
  });
});

describe('lessonSession reducer — the absorption gesture', () => {
  it('tapping an Item marks it Absorbed and opens its card', () => {
    const s = reducer(startState(), tapItem({itemId: 'giveup'}));
    expect(s.decided.giveup).toBe('absorbed');
    expect(s.openCardItemId).toBe('giveup');
    expect(s.justAbsorbedItemId).toBe('giveup');
  });

  it('first absorption increments the North Star and fires the +1 float', () => {
    const s = reducer(startState(), tapItem({itemId: 'giveup'}));
    expect(countAbsorbed(s)).toBe(1);
    expect(selectNorthStarLive(s)).toBe(NS_BASE + 1);
    expect(s.absorbFloatKey).toBe(1);
  });

  it('re-tapping an Absorbed Item re-opens its card WITHOUT re-incrementing', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'giveup'}));
    s = reducer(s, closeCard());
    const floatBefore = s.absorbFloatKey;

    s = reducer(s, tapItem({itemId: 'giveup'}));
    expect(s.openCardItemId).toBe('giveup'); // card re-opened
    expect(countAbsorbed(s)).toBe(1); // still one
    expect(selectNorthStarLive(s)).toBe(NS_BASE + 1);
    expect(s.absorbFloatKey).toBe(floatBefore); // no new float
    expect(s.justAbsorbedItemId).toBeNull();
  });

  it('North Star counts each distinct Absorbed Item exactly once', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'reshaping'}));
    s = reducer(s, tapItem({itemId: 'giveup'}));
    s = reducer(s, tapItem({itemId: 'reshaping'})); // re-tap
    expect(countAbsorbed(s)).toBe(2);
    expect(selectNorthStarLive(s)).toBe(NS_BASE + 2);
  });
});

describe('lessonSession reducer — "Biết hết phần còn lại"', () => {
  it('marks every still-undecided projected Item Known, leaving Absorbed ones', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'giveup'})); // Absorbed
    s = reducer(s, markRestKnown());

    expect(s.decided.giveup).toBe('absorbed');
    PROJECTED.filter(id => id !== 'giveup').forEach(id => {
      expect(s.decided[id]).toBe('known');
    });
    expect(countRemaining(s)).toBe(0);
    expect(isAllDecided(s)).toBe(true);
  });

  it('does not touch the North Star (Known Items never count)', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'giveup'}));
    s = reducer(s, markRestKnown());
    expect(countAbsorbed(s)).toBe(1);
    expect(selectNorthStarLive(s)).toBe(NS_BASE + 1);
  });
});

describe('lessonSession reducer — completion', () => {
  it('is gated until every projected Item is processed', () => {
    let s = startState();
    PROJECTED.slice(0, PROJECTED.length - 1).forEach(id => {
      s = reducer(s, tapItem({itemId: id}));
    });
    expect(isAllDecided(s)).toBe(false); // one still undecided
  });

  it('completeSession turns untapped Items into Known and marks completed', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'giveup'})); // only one tapped
    s = reducer(s, completeSession());

    expect(s.completed).toBe(true);
    expect(s.decided.giveup).toBe('absorbed');
    PROJECTED.filter(id => id !== 'giveup').forEach(id => {
      expect(s.decided[id]).toBe('known'); // untapped → Known
    });
    expect(isAllDecided(s)).toBe(true);
  });

  it('North Star reflects only genuinely Absorbed Items after completion', () => {
    let s = startState();
    s = reducer(s, tapItem({itemId: 'reshaping'}));
    s = reducer(s, tapItem({itemId: 'cond'}));
    s = reducer(s, completeSession());
    expect(countAbsorbed(s)).toBe(2);
    expect(selectNorthStarLive(s)).toBe(NS_BASE + 2);
  });

  it('absorbing every Item makes completion add N to the North Star', () => {
    let s = startState();
    PROJECTED.forEach(id => {
      s = reducer(s, tapItem({itemId: id}));
    });
    expect(isAllDecided(s)).toBe(true);
    s = reducer(s, completeSession());
    expect(countAbsorbed(s)).toBe(PROJECTED.length);
    expect(selectNorthStarLive(s)).toBe(NS_BASE + PROJECTED.length);
  });
});

describe('lessonSession reducer — sentence translation reveal', () => {
  it('toggles one sentence on and off', () => {
    let s = startState();
    s = reducer(s, toggleSentenceTranslation({sentenceId: 's0'}));
    expect(s.revealedSentences.s0).toBe(true);
    s = reducer(s, toggleSentenceTranslation({sentenceId: 's0'}));
    expect(s.revealedSentences.s0).toBe(false);
  });

  it('toggle-all reveals all when any is hidden, then hides all', () => {
    const ids = ['s0', 's1', 's2'];
    let s = startState();
    s = reducer(s, toggleSentenceTranslation({sentenceId: 's0'})); // one open

    s = reducer(s, toggleAllSentenceTranslations({sentenceIds: ids}));
    ids.forEach(id => expect(s.revealedSentences[id]).toBe(true)); // all open

    s = reducer(s, toggleAllSentenceTranslations({sentenceIds: ids}));
    ids.forEach(id => expect(s.revealedSentences[id]).toBe(false)); // all hidden
  });
});
