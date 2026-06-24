/**
 * The bundled Golden First Lesson (CONTEXT.md → "Golden First Lesson").
 *
 * A hand-crafted, heavily-QA'd Lesson used as the very first Lesson in
 * onboarding. It ships bundled in-app so the first run works even on weak
 * signal (no backend dependency) — exactly the data this Reading slice runs
 * against. Content mirrors the design handoff's static demo
 * (`lpData()` / passage in Inflow.dc.html, Core Loop section).
 *
 * Item ids reuse the handoff keys so the encoding/order match the spec. The
 * passage's projected Items are the six in `lesson.items`; `tools` is rendered
 * as an already-Absorbed Item (review-in-context, ADR re: re-encounter) so the
 * "already-Absorbed Items highlighted inline" behavior is demonstrable.
 */

import type {Lesson} from './types';

/**
 * Items the learner Absorbed in a previous Lesson that re-appear here, so they
 * render pre-highlighted (teal→amber) inline. They are NOT part of this
 * Lesson's projected set and do not gate completion or re-increment the North
 * Star (CONTEXT.md → SRS "review-in-context").
 */
export const PRE_ABSORBED_ITEM_IDS = ['tools'] as const;

export const GOLDEN_FIRST_LESSON: Lesson = {
  id: 'golden-first-lesson',
  title: 'The Future of AI',
  topic: 'Công nghệ',
  cefr: 'B1',
  items: [
    {
      id: 'reshaping',
      type: 'vocabulary',
      headword: 'reshaping',
      meaning: 'định hình lại',
      cefr: 'B2',
      ipa: '/ˌriːˈʃeɪpɪŋ/',
      posLabel: 'động từ · B2',
      example: 'AI is reshaping how we work.',
    },
    {
      id: 'adopt',
      type: 'vocabulary',
      headword: 'adopt',
      meaning: 'áp dụng, tiếp nhận',
      cefr: 'B1',
      ipa: '/əˈdɒpt/',
      posLabel: 'động từ · B1',
      example: '…and adopt new tools every day.',
    },
    {
      id: 'giveup',
      type: 'chunk',
      headword: 'give up',
      meaning: 'từ bỏ',
      cefr: 'B1',
      posLabel: 'chunk · B1',
      pattern: 'theo sau: V-ing / danh từ',
      example: 'Many companies give up old habits.',
      chunkOrigin: 'anchor',
    },
    {
      id: 'lookfwd',
      type: 'chunk',
      headword: 'look forward to',
      meaning: 'mong chờ',
      cefr: 'B1',
      posLabel: 'chunk · B1',
      pattern: 'theo sau: V-ing',
      example: 'Teams look forward to using them.',
      chunkOrigin: 'candidate',
    },
    {
      id: 'cond',
      type: 'grammarPoint',
      headword: 'Câu điều kiện loại 2',
      meaning: 'Giả định trái thực tế ở hiện tại.',
      cefr: 'B1',
      posLabel: 'ngữ pháp · B1',
      pattern: 'If + quá khứ đơn, … would + V',
      explanation: 'Giả định trái thực tế ở hiện tại — điều không có thật.',
      example: 'If teams learned to use them, they would save hours.',
    },
    {
      id: 'reluctant',
      type: 'vocabulary',
      headword: 'reluctant',
      meaning: 'miễn cưỡng',
      cefr: 'B2',
      ipa: '/rɪˈlʌktənt/',
      posLabel: 'tính từ · B2',
      example: '…some workers feel reluctant to change.',
    },
  ],
  passage: {
    sentences: [
      {
        id: 's0',
        spans: [
          {kind: 'text', text: 'Artificial intelligence is '},
          {kind: 'item', itemId: 'reshaping'},
          {kind: 'text', text: ' how we work.'},
        ],
        translation: 'Trí tuệ nhân tạo đang định hình lại cách chúng ta làm việc.',
      },
      {
        id: 's1',
        spans: [
          {kind: 'text', text: 'Many companies '},
          {kind: 'item', itemId: 'giveup'},
          {kind: 'text', text: ' old habits and '},
          {kind: 'item', itemId: 'adopt'},
          {kind: 'text', text: ' new '},
          {kind: 'item', itemId: 'tools'},
          {kind: 'text', text: ' every day.'},
        ],
        translation: 'Nhiều công ty từ bỏ thói quen cũ và áp dụng công cụ mới mỗi ngày.',
      },
      {
        id: 's2',
        spans: [
          {kind: 'text', text: 'Teams '},
          {kind: 'item', itemId: 'lookfwd'},
          {kind: 'text', text: ' using them.'},
        ],
        translation: 'Các nhóm mong chờ được dùng chúng.',
      },
      {
        id: 's3',
        spans: [{kind: 'item', itemId: 'cond'}],
        translation: 'Nếu các nhóm học cách dùng chúng tốt, họ sẽ tiết kiệm được nhiều giờ mỗi tuần.',
      },
      {
        id: 's4',
        spans: [
          {kind: 'text', text: 'Still, some workers feel '},
          {kind: 'item', itemId: 'reluctant'},
          {kind: 'text', text: ' to change.'},
        ],
        translation: 'Tuy vậy, một số người vẫn còn e ngại thay đổi.',
      },
    ],
  },
};

/**
 * The pre-Absorbed `tools` Item, used to render its inline token (review-in-
 * context). Kept out of `lesson.items` so it never enters the projected/
 * completion set.
 */
export const PRE_ABSORBED_ITEMS = {
  tools: {
    id: 'tools',
    type: 'vocabulary' as const,
    headword: 'tools',
    meaning: 'công cụ',
    cefr: 'A2' as const,
    ipa: '/tuːlz/',
    posLabel: 'danh từ · A2',
    example: '…and adopt new tools every day.',
  },
};
