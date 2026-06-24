/**
 * Listening Replay audio engine — the playback seam for the Listening Replay
 * Practice Mode (screens.md §10, ADR-0002).
 *
 * The project ships no native audio library yet (see package.json), so this
 * hook is built against a small, **mockable** `LessonAudioClock` interface
 * rather than a concrete player. The default clock is a pure JS timeline (a
 * `setInterval`-driven cursor over the Lesson's `durationSec`), which lets the
 * full per-sentence / per-Item replay flow run end-to-end on the bundled
 * fixture with no native deps. When a real RN audio backend lands (e.g.
 * react-native-track-player / react-native-video), implement `LessonAudioClock`
 * over it and pass it in — the UI and timestamp logic are unchanged.
 *
 * All playback is driven by the shared-layer **timestamps**: the hook seeks to a
 * span's `start`, plays, and auto-pauses at its `end`. That is exactly what
 * "replay this sentence", "replay this Item's span", and "slow" need.
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {AudioSpan, LessonAudio} from './types';

/** The slowed-down playback rate for the "🐢 chậm" toggle. */
export const SLOW_RATE = 0.6;
/** Full-speed playback rate. */
export const NORMAL_RATE = 1;

/**
 * The minimal playback surface the hook needs. A real audio backend implements
 * this; the default `createMockAudioClock` fakes it with a JS timer so the
 * feature is testable and runs with no native dependency.
 */
export interface LessonAudioClock {
  /** Begin advancing the cursor at the current rate. */
  play: () => void;
  /** Stop advancing the cursor (position retained). */
  pause: () => void;
  /** Jump the cursor to an absolute time (seconds). */
  seek: (timeSec: number) => void;
  /** Set the playback rate (1 = normal, <1 = slow). */
  setRate: (rate: number) => void;
  /** Read the current cursor time (seconds). */
  getPosition: () => number;
  /** Subscribe to cursor ticks; returns an unsubscribe fn. */
  subscribe: (listener: (positionSec: number) => void) => () => void;
  /** Release timers / native resources. */
  dispose: () => void;
}

/**
 * A pure-JS audio clock used when no native player is wired. Advances a cursor
 * over `[0, durationSec]` at `rate`, ticking listeners ~20×/s. Deterministic
 * enough for the player UI and unit tests (timers can be faked).
 */
export function createMockAudioClock(durationSec: number): LessonAudioClock {
  let position = 0;
  let rate = NORMAL_RATE;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastTickAt = 0;
  const listeners = new Set<(p: number) => void>();
  const TICK_MS = 50;

  const emit = () => listeners.forEach(l => l(position));

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const play = () => {
    if (timer) return;
    lastTickAt = Date.now();
    timer = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickAt) / 1000;
      lastTickAt = now;
      position = Math.min(durationSec, position + dt * rate);
      emit();
      if (position >= durationSec) {
        stop();
      }
    }, TICK_MS);
  };

  return {
    play,
    pause: stop,
    seek: timeSec => {
      position = Math.max(0, Math.min(durationSec, timeSec));
      lastTickAt = Date.now();
      emit();
    },
    setRate: r => {
      rate = r;
    },
    getPosition: () => position,
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      stop();
      listeners.clear();
    },
  };
}

/**
 * Resolve which sentence the cursor sits in, given per-sentence spans. Pure and
 * exported so the timestamp logic can be unit-tested without rendering. Clamps:
 * before the first span → 0; past the last → the last index.
 */
export function sentenceIndexAt(
  sentenceTimestamps: {start: number; end: number}[],
  positionSec: number,
): number {
  const idx = sentenceTimestamps.findIndex(
    s => positionSec >= s.start && positionSec < s.end,
  );
  if (idx !== -1) return idx;
  if (sentenceTimestamps.length === 0) return 0;
  return positionSec <= 0 ? 0 : sentenceTimestamps.length - 1;
}

/** What the Listening Replay UI gets back from the engine. */
export interface ListeningReplayAudio {
  /** Whether the cursor is currently advancing. */
  playing: boolean;
  /** Current cursor time, in seconds. */
  positionSec: number;
  /** Whether slow mode ("🐢 chậm") is active. */
  slow: boolean;
  /** Index of the sentence currently under the cursor (clamped). */
  currentSentenceIndex: number;
  /** The Item id whose span is being replayed in isolation, else null. */
  replayingItemId: string | null;
  /** Play/pause the whole timeline from the current position. */
  togglePlay: () => void;
  /** Toggle slow mode; takes effect immediately. */
  toggleSlow: () => void;
  /** Play one sentence span from its start; auto-pauses at its end. */
  playSentence: (index: number) => void;
  /** Replay a single Item's audio span (uses Item timestamps). */
  replayItem: (itemId: string) => void;
  /** Step to the previous / next sentence and play it. */
  prevSentence: () => void;
  nextSentence: () => void;
}

/**
 * Drives Listening Replay playback for one audio Lesson. Pass a custom
 * `makeClock` to back it with a real audio engine; the default is the mock
 * clock so the feature works with no native deps.
 */
export function useListeningReplayAudio(
  audio: LessonAudio,
  makeClock: (durationSec: number) => LessonAudioClock = createMockAudioClock,
): ListeningReplayAudio {
  const clock = useMemo(
    () => makeClock(audio.durationSec),
    [makeClock, audio.durationSec],
  );

  const [playing, setPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [slow, setSlow] = useState(false);
  const [replayingItemId, setReplayingItemId] = useState<string | null>(null);

  // The span we auto-pause at (sentence or single Item); null = play to end.
  const stopAtRef = useRef<number | null>(null);

  const sentenceTimestamps = audio.sentenceTimestamps;

  useEffect(() => {
    const unsub = clock.subscribe(pos => {
      setPositionSec(pos);
      const stopAt = stopAtRef.current;
      if (stopAt != null && pos >= stopAt) {
        clock.pause();
        stopAtRef.current = null;
        setPlaying(false);
        setReplayingItemId(null);
      } else if (pos >= audio.durationSec) {
        setPlaying(false);
      }
    });
    return () => {
      unsub();
      clock.dispose();
    };
  }, [clock, audio.durationSec]);

  const playSpan = useCallback(
    (span: AudioSpan, itemId: string | null) => {
      clock.seek(span.start);
      stopAtRef.current = span.end;
      setReplayingItemId(itemId);
      clock.play();
      setPlaying(true);
    },
    [clock],
  );

  const togglePlay = useCallback(() => {
    if (playing) {
      clock.pause();
      setPlaying(false);
      return;
    }
    // Resume free play to the end (clear any single-span stop point).
    stopAtRef.current = null;
    setReplayingItemId(null);
    if (clock.getPosition() >= audio.durationSec) {
      clock.seek(0);
    }
    clock.play();
    setPlaying(true);
  }, [clock, playing, audio.durationSec]);

  const toggleSlow = useCallback(() => {
    setSlow(prev => {
      const next = !prev;
      clock.setRate(next ? SLOW_RATE : NORMAL_RATE);
      return next;
    });
  }, [clock]);

  const playSentence = useCallback(
    (index: number) => {
      const span = sentenceTimestamps[index];
      if (!span) return;
      playSpan(span, null);
    },
    [sentenceTimestamps, playSpan],
  );

  const replayItem = useCallback(
    (itemId: string) => {
      const span = audio.itemTimestamps.find(s => s.itemId === itemId);
      if (!span) return;
      playSpan(span, itemId);
    },
    [audio.itemTimestamps, playSpan],
  );

  const currentSentenceIndex = useMemo(
    () => sentenceIndexAt(sentenceTimestamps, positionSec),
    [sentenceTimestamps, positionSec],
  );

  const prevSentence = useCallback(() => {
    playSentence(Math.max(0, currentSentenceIndex - 1));
  }, [playSentence, currentSentenceIndex]);

  const nextSentence = useCallback(() => {
    playSentence(
      Math.min(sentenceTimestamps.length - 1, currentSentenceIndex + 1),
    );
  }, [playSentence, currentSentenceIndex, sentenceTimestamps.length]);

  return {
    playing,
    positionSec,
    slow,
    currentSentenceIndex,
    replayingItemId,
    togglePlay,
    toggleSlow,
    playSentence,
    replayItem,
    prevSentence,
    nextSentence,
  };
}
