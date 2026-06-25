/**
 * Lesson Player — §10 flagship flow data (screens.md §10 · `LGoq4`).
 *
 * Authored, bundled content for the **Cover → Warm-up → Reading immersion**
 * half of the Lesson Player (issue #44), mirroring the design nodes
 * `ZeE5Q`/`LvMs5`/`tiWTV`/`fvpcK` (Cover variants), `oFKYA`/`L8QvdJ` (Warm-up),
 * and `ZVzfM`/`edu17`/`oyotO` (Reading pages 1/3/5). It ships in-app so the
 * flagship loop runs with no backend dependency (CONTEXT.md → "Golden First
 * Lesson"). All Vietnamese chrome is real product copy and matches the pen.
 *
 * The Items below are the projected Candidate Items of "The Future of AI"
 * Lesson (ADR-0001 per-learner projection). They are the tap targets of the
 * Reading immersion (the absorption gesture) and the rows of the Warm-up list.
 */

import type {
  Item,
  Lesson,
  LessonCover,
  ReadingPage,
  SourceType,
  WarmupGroup,
} from './types';

/**
 * The projected Vocabulary / Chunk / Grammar-Point Items shown in the Warm-up
 * and tapped inline during the Reading immersion. Item ids are stable Candidate
 * Item ids (Inventory ids for Chunks / Grammar Points — ADR-0003/0004).
 */
export const SECTION10_ITEMS: Item[] = [
  // --- Vocabulary ---
  {
    id: 's10-reshaping',
    type: 'vocabulary',
    headword: 'reshaping',
    meaning: 'định hình lại',
    cefr: 'B2',
    ipa: '/ˌriːˈʃeɪpɪŋ/',
    posLabel: 'động từ · B2',
    example: 'AI is reshaping how we work.',
  },
  {
    id: 's10-adopt',
    type: 'vocabulary',
    headword: 'adopt',
    meaning: 'áp dụng, tiếp nhận',
    cefr: 'B1',
    ipa: '/əˈdɒpt/',
    posLabel: 'động từ · B1',
    example: '…and adopt new tools every day.',
  },
  {
    id: 's10-reluctant',
    type: 'vocabulary',
    headword: 'reluctant',
    meaning: 'miễn cưỡng',
    cefr: 'B2',
    ipa: '/rɪˈlʌktənt/',
    posLabel: 'tính từ · B2',
    example: 'Still, some workers remain reluctant.',
  },
  {
    id: 's10-distant',
    type: 'vocabulary',
    headword: 'distant',
    meaning: 'xa vời',
    cefr: 'B1',
    ipa: '/ˈdɪstənt/',
    posLabel: 'tính từ · B1',
    example: 'AI is no longer a distant dream.',
  },
  {
    id: 's10-vast',
    type: 'vocabulary',
    headword: 'vast',
    meaning: 'khổng lồ',
    cefr: 'B2',
    ipa: '/vɑːst/',
    posLabel: 'tính từ · B2',
    example: 'By feeding models vast amounts of data…',
  },
  {
    id: 's10-versus',
    type: 'vocabulary',
    headword: 'versus',
    meaning: 'đối đầu với',
    cefr: 'B2',
    ipa: '/ˈvɜːsəs/',
    posLabel: 'giới từ · B2',
    example: 'It will not be machines versus people.',
  },
  {
    id: 's10-quietly',
    type: 'vocabulary',
    headword: 'quietly',
    meaning: 'lặng lẽ',
    cefr: 'B1',
    ipa: '/ˈkwaɪətli/',
    posLabel: 'trạng từ · B1',
    example: 'It has quietly moved into the tools we use.',
  },
  {
    id: 's10-recommend',
    type: 'vocabulary',
    headword: 'recommend',
    meaning: 'gợi ý, đề xuất',
    cefr: 'B1',
    ipa: '/ˌrekəˈmend/',
    posLabel: 'động từ · B1',
    example: '…to sort messages, recommend films…',
  },
  {
    id: 's10-breakthrough',
    type: 'vocabulary',
    headword: 'breakthrough',
    meaning: 'bước đột phá',
    cefr: 'B2',
    ipa: '/ˈbreɪkθruː/',
    posLabel: 'danh từ · B2',
    example: 'Then came a breakthrough.',
  },
  {
    id: 's10-clumsy',
    type: 'vocabulary',
    headword: 'clumsy',
    meaning: 'vụng về',
    cefr: 'B2',
    ipa: '/ˈklʌmzi/',
    posLabel: 'tính từ · B2',
    example: 'Tools that once felt clumsy began to feel natural.',
  },
  {
    id: 's10-curious',
    type: 'vocabulary',
    headword: 'curious',
    meaning: 'tò mò, ham học hỏi',
    cefr: 'B1',
    ipa: '/ˈkjʊəriəs/',
    posLabel: 'tính từ · B1',
    example: 'Those who stay curious will find themselves set free.',
  },
  {
    id: 's10-replace',
    type: 'vocabulary',
    headword: 'replace',
    meaning: 'thay thế',
    cefr: 'B1',
    ipa: '/rɪˈpleɪs/',
    posLabel: 'động từ · B1',
    example: '…machines might one day replace them.',
  },
  // --- Chunks (ADR-0004) ---
  {
    id: 's10-giveup',
    type: 'chunk',
    headword: 'give up',
    meaning: 'từ bỏ',
    cefr: 'B1',
    ipa: '/ˌɡɪv ˈʌp/',
    posLabel: 'chunk · B1',
    pattern: 'theo sau: V-ing / danh từ',
    example: 'Many companies give up old habits.',
    chunkOrigin: 'anchor',
  },
  {
    id: 's10-lookfwd',
    type: 'chunk',
    headword: 'look forward to',
    meaning: 'mong chờ',
    cefr: 'B1',
    ipa: '/ˌlʊk ˈfɔːwəd tə/',
    posLabel: 'chunk · B1',
    pattern: 'theo sau: V-ing',
    example: 'Teams look forward to using them.',
    chunkOrigin: 'candidate',
  },
  {
    id: 's10-relyon',
    type: 'chunk',
    headword: 'rely on',
    meaning: 'dựa vào',
    cefr: 'B1',
    ipa: '/rɪˈlaɪ ɒn/',
    posLabel: 'chunk · B1',
    pattern: 'theo sau: danh từ / V-ing',
    example: 'Many companies now rely on it.',
    chunkOrigin: 'anchor',
  },
  {
    id: 's10-struggleto',
    type: 'chunk',
    headword: 'struggle to',
    meaning: 'vật lộn, chật vật',
    cefr: 'B1',
    ipa: '/ˈstrʌɡl tə/',
    posLabel: 'cụm động từ · B1',
    pattern: 'theo sau: to + V (nguyên thể)',
    example: 'Researchers struggled to teach machines.',
    chunkOrigin: 'anchor',
  },
  // --- Grammar Points (ADR-0003) ---
  {
    id: 's10-cond2',
    type: 'grammarPoint',
    headword: 'Câu điều kiện loại 2',
    meaning: 'Giả định trái thực tế ở hiện tại.',
    cefr: 'B1',
    posLabel: 'ngữ pháp · B1',
    pattern: 'If + quá khứ đơn, … would + V',
    explanation: 'Giả định trái thực tế ở hiện tại — điều không có thật.',
    example: 'If teams learned to use it wisely, they would save countless hours each week.',
  },
  {
    id: 's10-presentperfect',
    type: 'grammarPoint',
    headword: 'Hiện tại hoàn thành',
    meaning: 'Diễn tả việc đã xảy ra và còn liên quan đến hiện tại.',
    cefr: 'B1',
    posLabel: 'ngữ pháp · B1',
    pattern: 'have/has + V3',
    explanation: 'Diễn tả việc đã xảy ra và còn liên quan đến hiện tại.',
    example: 'Over the past decade it has quietly moved into the tools we use.',
  },
];

/** Index Items by id for quick lookup by the Warm-up + Reading components. */
export const SECTION10_ITEMS_BY_ID: Record<string, Item> = SECTION10_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, Item>,
);

/**
 * The Warm-up groups (screens.md §10 LP2/LP2b), grouped by the three Item types
 * in the design's order: Vocabulary → Chunk → Grammar Point. The deck (LP2)
 * walks these in order; the list (LP2b) shows them grouped with count badges.
 */
export const SECTION10_WARMUP_GROUPS: WarmupGroup[] = (
  ['vocabulary', 'chunk', 'grammarPoint'] as const
).map(type => ({
  type,
  items: SECTION10_ITEMS.filter(item => item.type === type),
}));

/** Flat Warm-up deck order (Vocabulary → Chunk → Grammar Point). */
export const SECTION10_WARMUP_ORDER: Item[] = SECTION10_WARMUP_GROUPS.flatMap(
  group => group.items,
);

/**
 * Cover (screens.md §10 LP1) metadata per Source type, keyed by `SourceType`.
 * The default ("The Future of AI" YouTube Lesson) is `youtube`; the article /
 * podcast / raw-text variants mirror the pen's `LvMs5` / `tiWTV` / `fvpcK`
 * nodes. Item-count preview is shared (12 Vocabulary · 4 Chunk · 2 Grammar).
 */
export const SECTION10_COVERS: Record<SourceType, LessonCover> = {
  youtube: {
    sourceType: 'youtube',
    sourcePillLabel: '▶ YouTube',
    originTag: '✨ Tạo riêng từ video bạn đã lưu',
    channelLine: 'TechVision · Công nghệ',
    durationLabel: '12:30',
    lengthChip: '18 Item',
    originalLinkLabel: 'Xem nội dung gốc trên YouTube',
  },
  article: {
    sourceType: 'article',
    sourcePillLabel: '📄 Bài viết',
    originTag: '✨ Tạo riêng từ bài viết bạn đã lưu',
    channelLine: 'The Atlantic · Tâm lý học',
    durationLabel: '6 phút đọc',
    lengthChip: '1 240 từ',
    originalLinkLabel: 'Đọc bài gốc trên web',
  },
  podcast: {
    sourceType: 'podcast',
    sourcePillLabel: '🎧 Podcast',
    originTag: '✨ Tạo riêng từ podcast bạn đang nghe',
    channelLine: 'The Knowledge Project · Năng suất',
    durationLabel: '28:15',
    lengthChip: 'Tập 142',
    originalLinkLabel: 'Nghe tập gốc trên Spotify',
  },
  text: {
    sourceType: 'text',
    sourcePillLabel: '📝 Văn bản của bạn',
    originTag: '✨ Tạo riêng từ đoạn text bạn dán vào',
    channelLine: 'Dán từ Notes · hôm nay',
    durationLabel: '5 phút đọc',
    lengthChip: '320 từ',
    originalLinkLabel: 'Xem văn bản gốc',
    textPreview:
      'Học từ vựng hiệu quả nhất khi bạn gặp lại từ trong nhiều ngữ cảnh khác nhau, thay vì học thuộc danh sách…',
  },
};

/**
 * The per-Source-type Cover title (the design's article/podcast/text variants
 * carry their own Source titles). The default `youtube` Cover uses the Lesson's
 * own title ("The Future of AI").
 */
export const SECTION10_COVER_TITLES: Partial<Record<SourceType, string>> = {
  article: 'Tâm lý của thói quen',
  podcast: 'Deep Work in a Distracted World',
  text: 'Ghi chú: Cách học từ vựng',
};

const text = (value: string): {kind: 'text'; text: string} => ({
  kind: 'text',
  text: value,
});
const para: {kind: 'text'; text: string} = {kind: 'text', text: ''};
const item = (
  itemId: string,
  surface: string,
  grammar?: boolean,
): {kind: 'item'; itemId: string; text: string; grammar?: boolean} => ({
  kind: 'item',
  itemId,
  text: surface,
  ...(grammar ? {grammar: true} : {}),
});

/**
 * The Reading-immersion pages (screens.md §10 LP3 · `ZVzfM` / `edu17` /
 * `oyotO`). Pages 1, 3 and 5 reproduce the pen exactly (the referenced nodes);
 * pages 2 and 4 bridge the article in the same Newsreader style. Teal Item
 * spans are the absorption-gesture targets; the Grammar-Point run on page 1 is
 * the design's teal-soft highlighted sentence (the `If…` conditional).
 */
export const SECTION10_READING_PAGES: ReadingPage[] = [
  {
    id: 'p1',
    spans: [
      text('Artificial intelligence is no longer a '),
      item('s10-distant', 'distant'),
      text(' dream. Over the past decade it has quietly moved from research labs into the tools we use every day. Many companies now '),
      item('s10-relyon', 'rely on'),
      text(' it to sort messages, recommend films, and even write simple code.'),
      para,
      text('Yet the technology is still young. '),
      item(
        's10-cond2',
        'If teams learned to use it wisely, they would save countless hours each week.',
        true,
      ),
      text(' Still, some workers remain '),
      item('s10-reluctant', 'reluctant'),
      text(', worried that machines might one day replace them.'),
    ],
  },
  {
    id: 'p2',
    spans: [
      text('To understand why, it helps to look back. Early computers could follow rules, but they could not '),
      item('s10-adopt', 'adopt'),
      text(' new behaviour on their own. Engineers wrote every step by hand, and the smallest change meant rewriting the program from scratch.'),
      para,
      text('Progress was slow, and for years many believed that truly flexible machines were simply impossible to build.'),
    ],
  },
  {
    id: 'p3',
    spans: [
      text('The change did not happen overnight. For years, researchers '),
      item('s10-struggleto', 'struggled to'),
      text(' teach machines the simplest human tasks. Recognising a face, understanding a joke, or crossing a busy street all proved surprisingly hard.'),
      para,
      text('Then came a breakthrough. By feeding models '),
      item('s10-vast', 'vast'),
      text(' amounts of data, engineers found that the systems could learn patterns '),
      item('s10-relyon', 'on their own'),
      text('. Suddenly, tools that once felt clumsy began to feel almost natural.'),
    ],
  },
  {
    id: 'p4',
    spans: [
      text('This new wave of tools is '),
      item('s10-reshaping', 'reshaping'),
      text(' whole industries. Designers, doctors and teachers now '),
      item('s10-relyon', 'rely on'),
      text(' assistants that draft, summarise and suggest in seconds.'),
      para,
      text('Teams who once feared the technology now '),
      item('s10-lookfwd', 'look forward to'),
      text(' it, because it frees them from the dull, repetitive parts of their work.'),
    ],
  },
  {
    id: 'p5',
    spans: [
      text('In the end, the future of work will not be machines '),
      item('s10-versus', 'versus'),
      text(' people. It will be people who know how to work with machines, and those who do not.'),
      para,
      text('The choice, as always, is ours to make. Those who stay curious and keep learning will find themselves not replaced, but '),
      item('s10-setfree', 'set free'),
      text(' to do their best work.'),
    ],
  },
];

/**
 * The `set free` Chunk closes the final Reading page (`oyotO`) — added here so
 * the page-5 token resolves even though it sits outside the Warm-up's 12 shown
 * rows (review-in-context; CONTEXT.md → SRS re-encounter).
 */
SECTION10_ITEMS_BY_ID['s10-setfree'] = {
  id: 's10-setfree',
  type: 'chunk',
  headword: 'set free',
  meaning: 'được giải phóng',
  cefr: 'B2',
  ipa: '/ˌset ˈfriː/',
  posLabel: 'chunk · B2',
  pattern: 'theo sau: to + V',
  example: '…set free to do their best work.',
  chunkOrigin: 'candidate',
};

/** Total pages in the Reading immersion (the "Trang N / M" denominator). */
export const SECTION10_PAGE_COUNT = SECTION10_READING_PAGES.length;

/**
 * The bundled §10 flagship Lesson — "The Future of AI" with an authored Cover,
 * Warm-up and paginated Reading immersion. Carries the common-core shape
 * (Items + a Bilingual Passage) plus the §10 presentation layers, so the Lesson
 * Player can run the Cover → Warm-up → Reading flow with no backend. The
 * `passage` mirrors the reading pages (one sentence per teal Item) so the
 * post-reading Quiz / Completion stages downstream keep working.
 */
export const SECTION10_LESSON_ID = 'section10-future-of-ai';

export const SECTION10_LESSON: Lesson = {
  id: SECTION10_LESSON_ID,
  title: 'The Future of AI',
  topic: 'Công nghệ',
  cefr: 'B1',
  items: SECTION10_ITEMS,
  cover: SECTION10_COVERS.youtube,
  readingPages: SECTION10_READING_PAGES,
  passage: {
    sentences: SECTION10_READING_PAGES.map((page, i) => ({
      id: `s10-s${i}`,
      spans: page.spans
        .filter(span => span.text !== '')
        .map(span =>
          span.kind === 'item'
            ? {kind: 'item' as const, itemId: span.itemId}
            : {kind: 'text' as const, text: span.text},
        ),
      translation: '',
    })),
  },
};
