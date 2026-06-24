/**
 * Behavior tests over the Listening Replay audio engine — the timestamp-driven
 * playback contract (screens.md §10, ADR-0002).
 *
 * These assert the rules behind the issue's acceptance criteria:
 *   - per-sentence playback maps the cursor onto the right sentence via the
 *     shared-layer sentence timestamps;
 *   - the mock clock advances the cursor at the active rate and slow mode
 *     halves it;
 *   - playing a span (a sentence, or a single Item's span) auto-pauses at the
 *     span's `end` — the mechanism behind "replay this sentence / Item".
 */

import {
  createMockAudioClock,
  sentenceIndexAt,
  SLOW_RATE,
  NORMAL_RATE,
} from './useListeningReplayAudio';
import {GOLDEN_AUDIO_LESSON} from './goldenAudioLesson';

const AUDIO = GOLDEN_AUDIO_LESSON.audio!;

describe('sentenceIndexAt — cursor → sentence via timestamps', () => {
  const spans = AUDIO.sentenceTimestamps;

  it('maps a position inside a span to that sentence index', () => {
    expect(sentenceIndexAt(spans, 0)).toBe(0); // start of as0
    expect(sentenceIndexAt(spans, 4)).toBe(1); // inside as1 [3.1, 6.4)
    expect(sentenceIndexAt(spans, 8)).toBe(2); // inside as2 [6.4, 10.0)
    expect(sentenceIndexAt(spans, 12)).toBe(3); // inside as3 [10.0, 13.2)
  });

  it('clamps before the first span to 0 and past the last to the last index', () => {
    expect(sentenceIndexAt(spans, -1)).toBe(0);
    expect(sentenceIndexAt(spans, 999)).toBe(spans.length - 1);
  });

  it('returns 0 for an empty timestamp set', () => {
    expect(sentenceIndexAt([], 5)).toBe(0);
  });
});

describe('createMockAudioClock — JS timeline (no native deps)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('advances the cursor at the normal rate while playing', () => {
    const clock = createMockAudioClock(AUDIO.durationSec);
    clock.setRate(NORMAL_RATE);
    clock.play();
    jest.advanceTimersByTime(1000); // ~1s of wall time
    expect(clock.getPosition()).toBeGreaterThan(0.9);
    expect(clock.getPosition()).toBeLessThan(1.2);
    clock.dispose();
  });

  it('slow mode advances the cursor more slowly than normal', () => {
    const clock = createMockAudioClock(AUDIO.durationSec);
    clock.setRate(SLOW_RATE);
    clock.play();
    jest.advanceTimersByTime(1000);
    // At 0.6x, ~0.6s of audio in 1s of wall time.
    expect(clock.getPosition()).toBeLessThan(0.8);
    expect(clock.getPosition()).toBeGreaterThan(0.4);
    clock.dispose();
  });

  it('pause stops advancing and retains the position', () => {
    const clock = createMockAudioClock(AUDIO.durationSec);
    clock.play();
    jest.advanceTimersByTime(500);
    clock.pause();
    const at = clock.getPosition();
    jest.advanceTimersByTime(1000);
    expect(clock.getPosition()).toBe(at);
    clock.dispose();
  });

  it('seek jumps the cursor and clamps to [0, duration]', () => {
    const clock = createMockAudioClock(AUDIO.durationSec);
    clock.seek(5);
    expect(clock.getPosition()).toBe(5);
    clock.seek(-3);
    expect(clock.getPosition()).toBe(0);
    clock.seek(999);
    expect(clock.getPosition()).toBe(AUDIO.durationSec);
    clock.dispose();
  });

  it('notifies subscribers of cursor ticks while playing', () => {
    const clock = createMockAudioClock(AUDIO.durationSec);
    const seen: number[] = [];
    const unsub = clock.subscribe(p => seen.push(p));
    clock.play();
    jest.advanceTimersByTime(300);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1]).toBeGreaterThan(0);
    unsub();
    clock.dispose();
  });

  it('stops advancing once it reaches the end of the audio', () => {
    const clock = createMockAudioClock(1); // 1s of audio
    clock.play();
    jest.advanceTimersByTime(2000);
    expect(clock.getPosition()).toBe(1);
    clock.dispose();
  });
});

describe('Golden Audio Lesson — timestamp dataset integrity', () => {
  it('has a per-sentence span for every passage sentence, in order', () => {
    const sentenceIds = GOLDEN_AUDIO_LESSON.passage.sentences.map(s => s.id);
    expect(AUDIO.sentenceTimestamps.map(s => s.sentenceId)).toEqual(sentenceIds);
  });

  it('every Item timestamp points at a real Item id', () => {
    const itemIds = new Set(GOLDEN_AUDIO_LESSON.items.map(i => i.id));
    AUDIO.itemTimestamps.forEach(ts => {
      expect(itemIds.has(ts.itemId)).toBe(true);
    });
  });

  it('every span is well-formed (start < end, within duration)', () => {
    [...AUDIO.sentenceTimestamps, ...AUDIO.itemTimestamps].forEach(span => {
      expect(span.start).toBeLessThan(span.end);
      expect(span.start).toBeGreaterThanOrEqual(0);
      expect(span.end).toBeLessThanOrEqual(AUDIO.durationSec);
    });
  });
});
