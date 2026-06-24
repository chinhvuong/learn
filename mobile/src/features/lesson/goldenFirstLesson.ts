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

import type {DiscoverySuggestion} from './components/LessonCompleteView';
import type {Lesson, QuizQuestion} from './types';

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
 * The post-reading comprehension Quiz for the Golden First Lesson — a short set
 * of questions about the passage (ý chính · chi tiết · suy luận), mirroring the
 * design handoff's `lpQuizData`. Ships bundled so the first run works offline.
 *
 * Completing the Quiz closes the Lesson and hands off to the Completion recap.
 */
export const GOLDEN_FIRST_LESSON_QUIZ: QuizQuestion[] = [
  {
    id: 'q-main',
    type: 'mainIdea',
    prompt: 'Đoạn văn chủ yếu nói về điều gì?',
    options: [
      'AI đang thay đổi cách chúng ta làm việc — dù vài người còn e ngại',
      'Cách sửa một chiếc máy tính cũ',
      'Lịch sử của ngành du lịch',
    ],
    correctIndex: 0,
  },
  {
    id: 'q-detail-habits',
    type: 'detail',
    prompt: 'Theo bài, nhiều công ty làm gì với những thói quen cũ?',
    options: [
      'Từ bỏ chúng (give up)',
      'Giữ nguyên không đổi',
      'Bán lại cho công ty khác',
    ],
    correctIndex: 0,
  },
  {
    id: 'q-detail-workers',
    type: 'detail',
    prompt: 'Bài viết nói một số người lao động cảm thấy thế nào với sự thay đổi?',
    options: [
      'Miễn cưỡng, e ngại (reluctant)',
      'Rất hào hứng',
      'Hoàn toàn thờ ơ',
    ],
    correctIndex: 0,
  },
  {
    id: 'q-inference',
    type: 'inference',
    prompt: 'Nếu các nhóm học cách dùng công cụ tốt, bài viết ngụ ý điều gì?',
    options: [
      'Họ sẽ tiết kiệm nhiều giờ mỗi tuần',
      'Họ sẽ mất thêm thời gian',
      'Sẽ không có gì thay đổi',
    ],
    correctIndex: 0,
  },
];

/**
 * Stub Next-Lesson discovery suggestions shown below the fold on the Completion
 * recap (CONTEXT.md → "Discover" / "Next Lesson recommendation"). The real
 * recommendation handoff (priority A→B→D matching by Level + Interest Profile)
 * is wired by #3's consumer slice; these are placeholders so the below-the-fold
 * surface is demonstrable today.
 */
export const NEXT_LESSON_DISCOVERY: DiscoverySuggestion[] = [
  {id: 'ai-healthcare', title: 'AI in Healthcare', meta: '5 phút · Công nghệ · B1'},
  {id: 'remote-work', title: 'The Rise of Remote Work', meta: '4 phút · Công nghệ · B1'},
];

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
