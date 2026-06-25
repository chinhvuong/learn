/**
 * The bundled Golden Audio Lesson — the audio-Source counterpart of the Golden
 * First Lesson (goldenFirstLesson.ts), used to exercise the **Listening Replay**
 * Practice Mode (screens.md §10) with no backend dependency.
 *
 * It mirrors the Reading fixture's shape (same common core: Items + Bilingual
 * Passage) and layers on a `LessonAudio` block: a bundled audio asset plus the
 * shared-layer **timestamps** (per-sentence and per-Item spans, ADR-0002). The
 * passage text is the same common core revealed on demand ("Hiện lời"); only
 * the objective timestamps live in the audio layer.
 *
 * Audio asset: there is no licensed clip bundled yet, so `asset` is `null` and
 * the player runs on a mock clock keyed by `durationSec` (see
 * `useListeningReplayAudio`). When a curated clip is added to native assets,
 * swap `asset` for a `require('...')` (bundled) or a URL (lazily-aligned user
 * audio) — the timestamps already drive playback. Spans are illustrative,
 * monotonic, and consistent with the §10 wireframe ("give up" replayable).
 */

import type {Lesson} from './types';

export const GOLDEN_AUDIO_LESSON: Lesson = {
  id: 'golden-audio-lesson',
  title: 'Daily English: Habits',
  topic: 'Đời sống',
  cefr: 'B1',
  items: [
    {
      id: 'a-giveup',
      type: 'chunk',
      headword: 'give up',
      meaning: 'từ bỏ',
      cefr: 'B1',
      posLabel: 'chunk · B1',
      pattern: 'theo sau: V-ing / danh từ',
      example: 'Many people give up too early.',
      chunkOrigin: 'anchor',
    },
    {
      id: 'a-habit',
      type: 'vocabulary',
      headword: 'habit',
      meaning: 'thói quen',
      cefr: 'A2',
      ipa: '/ˈhæbɪt/',
      posLabel: 'danh từ · A2',
      example: 'A small habit can change your day.',
    },
    {
      id: 'a-stickwith',
      type: 'chunk',
      headword: 'stick with',
      meaning: 'kiên trì với',
      cefr: 'B1',
      posLabel: 'chunk · B1',
      pattern: 'theo sau: danh từ',
      example: 'If you stick with it, it gets easier.',
      chunkOrigin: 'candidate',
    },
    {
      id: 'a-gradually',
      type: 'vocabulary',
      headword: 'gradually',
      meaning: 'dần dần',
      cefr: 'B2',
      ipa: '/ˈɡrædʒuəli/',
      posLabel: 'trạng từ · B2',
      example: 'Change happens gradually.',
    },
  ],
  passage: {
    sentences: [
      {
        id: 'as0',
        spans: [
          {kind: 'text', text: 'Many people '},
          {kind: 'item', itemId: 'a-giveup'},
          {kind: 'text', text: ' too early.'},
        ],
        translation: 'Nhiều người từ bỏ quá sớm.',
      },
      {
        id: 'as1',
        spans: [
          {kind: 'text', text: 'A small '},
          {kind: 'item', itemId: 'a-habit'},
          {kind: 'text', text: ' can change your day.'},
        ],
        translation: 'Một thói quen nhỏ có thể thay đổi cả ngày của bạn.',
      },
      {
        id: 'as2',
        spans: [
          {kind: 'text', text: 'If you '},
          {kind: 'item', itemId: 'a-stickwith'},
          {kind: 'text', text: ' it, it gets easier.'},
        ],
        translation: 'Nếu bạn kiên trì với nó, mọi thứ sẽ dễ hơn.',
      },
      {
        id: 'as3',
        spans: [
          {kind: 'text', text: 'Change happens '},
          {kind: 'item', itemId: 'a-gradually'},
          {kind: 'text', text: '.'},
        ],
        translation: 'Sự thay đổi diễn ra dần dần.',
      },
    ],
  },
  audio: {
    asset: null,
    sourceLabel: 'Podcast · Daily English',
    kind: 'video',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1758598305014-2e8daf37b2b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3ODIzMjUyMzV8&ixlib=rb-4.1.0&q=80&w=1080',
    durationSec: 13.2,
    sentenceTimestamps: [
      {sentenceId: 'as0', start: 0, end: 3.1},
      {sentenceId: 'as1', start: 3.1, end: 6.4},
      {sentenceId: 'as2', start: 6.4, end: 10.0},
      {sentenceId: 'as3', start: 10.0, end: 13.2},
    ],
    itemTimestamps: [
      {itemId: 'a-giveup', start: 1.3, end: 2.0},
      {itemId: 'a-habit', start: 3.9, end: 4.4},
      {itemId: 'a-stickwith', start: 7.0, end: 7.7},
      {itemId: 'a-gradually', start: 11.4, end: 12.2},
    ],
  },
};
