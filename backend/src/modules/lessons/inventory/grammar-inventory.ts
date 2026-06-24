/**
 * The closed Grammar Inventory (ADR-0003 / CONTEXT.md → Grammar Inventory).
 *
 * A predefined, closed catalog of Grammar Points. The {@link GrammarMatcher}
 * **classifies** a Source's sentences against this catalog — it never generates
 * free-form grammar. Every match resolves to one of these stable `id`s, which is
 * what makes Grammar Points countable for the North Star, reviewable in SRS,
 * dedup-able, and Level-aware for the per-learner Candidate Item projection.
 *
 * Each entry carries:
 *  - `id`        — stable, human-readable, prefixed `GP_`. Never reused/renamed.
 *  - `name`      — canonical English name of the Grammar Point.
 *  - `cefr`      — the CEFR band this point is introduced at.
 *  - `level`     — the fine 0–100 score (CONTEXT.md → Level) for i+1 matching.
 *  - `explanationVi` — the ONE authored-once Vietnamese explanation (Native
 *                Language), reused everywhere (ADR-0003). Real product copy —
 *                do not translate/paraphrase elsewhere.
 *  - `matchers`  — one or more regular expressions used to classify a sentence
 *                as containing this point. Detection is conservative: a sentence
 *                matches a point only if a matcher fires.
 *
 * HITL / DEFERRED: the full Inventory is ~150–250 hand-authored, human-reviewed
 * entries (ADR-0003). This file seeds a **representative starter slice** across
 * the CEFR bands using the production schema; full curation of the Vietnamese
 * explanations and the long tail of points is a Human-In-The-Loop content task
 * tracked separately. Quality + correct structure here matter more than count.
 */

import { CEFR_TO_LEVEL, CefrBand } from './cefr';

/** One stable entry in the closed Grammar Inventory. */
export interface GrammarInventoryEntry {
  /** Stable Inventory id, prefixed `GP_`. Never renamed or reused. */
  id: string;
  /** Canonical English name of the Grammar Point. */
  name: string;
  /** CEFR band the point is introduced at. */
  cefr: CefrBand;
  /** Fine 0–100 Level score derived from the CEFR band. */
  level: number;
  /** The one authored-once Vietnamese (Native Language) explanation. */
  explanationVi: string;
  /** Classification patterns — a sentence containing this point matches one. */
  matchers: RegExp[];
}

/**
 * Build an entry, deriving the fine Level from the CEFR band so the two never
 * drift. Keeps the seed table below terse and consistent.
 */
function gp(
  id: string,
  name: string,
  cefr: CefrBand,
  explanationVi: string,
  matchers: RegExp[],
): GrammarInventoryEntry {
  return { id, name, cefr, level: CEFR_TO_LEVEL[cefr], explanationVi, matchers };
}

/**
 * The seeded Grammar Inventory slice — closed catalog, classify-only (ADR-0003).
 * Ordered roughly by CEFR band. Matchers are intentionally conservative.
 */
export const GRAMMAR_INVENTORY: readonly GrammarInventoryEntry[] = [
  // --- A1 ------------------------------------------------------------------
  gp(
    'GP_PRESENT_SIMPLE_BE',
    'present simple: to be',
    'A1',
    'Động từ "to be" (am/is/are) ở thì hiện tại đơn, dùng để mô tả trạng thái hoặc đặc điểm.',
    [/\b(i am|you are|he is|she is|it is|we are|they are)\b/i, /\b(am|is|are)\b/i],
  ),
  gp(
    'GP_THERE_IS_ARE',
    'there is / there are',
    'A1',
    'Cấu trúc "there is/are" dùng để nói có cái gì đó tồn tại.',
    [/\bthere\s+(is|are|was|were)\b/i],
  ),
  gp(
    'GP_CAN_ABILITY',
    'can for ability',
    'A1',
    'Động từ khuyết thiếu "can" diễn tả khả năng làm được việc gì.',
    [/\bcan(not|'t)?\s+[a-z]+/i],
  ),

  // --- A2 ------------------------------------------------------------------
  gp(
    'GP_PRESENT_CONTINUOUS',
    'present continuous',
    'A2',
    'Thì hiện tại tiếp diễn (am/is/are + V-ing) diễn tả hành động đang xảy ra.',
    [/\b(am|is|are)\s+[a-z]+ing\b/i],
  ),
  gp(
    'GP_PAST_SIMPLE',
    'past simple',
    'A2',
    'Thì quá khứ đơn diễn tả hành động đã hoàn tất trong quá khứ.',
    [/\b(was|were|did)\b/i, /\b[a-z]+ed\b/i],
  ),
  gp(
    'GP_GOING_TO_FUTURE',
    'be going to (future)',
    'A2',
    'Cấu trúc "be going to + V" diễn tả dự định hoặc dự đoán có căn cứ.',
    [/\b(am|is|are)\s+going\s+to\s+[a-z]+/i],
  ),
  gp(
    'GP_COMPARATIVES',
    'comparatives',
    'A2',
    'So sánh hơn: tính từ + "-er" hoặc "more + tính từ" + than.',
    [/\b[a-z]+er\s+than\b/i, /\bmore\s+[a-z]+\s+than\b/i],
  ),

  // --- B1 ------------------------------------------------------------------
  gp(
    'GP_PRESENT_PERFECT',
    'present perfect',
    'B1',
    'Thì hiện tại hoàn thành (have/has + V3) nối quá khứ với hiện tại, diễn tả trải nghiệm hoặc kết quả còn ảnh hưởng tới hiện tại.',
    [/\b(have|has)\s+(been|[a-z]+ed|[a-z]+en)\b/i],
  ),
  gp(
    'GP_USED_TO',
    'used to + V',
    'B1',
    'Cấu trúc "used to + V" diễn tả thói quen hoặc trạng thái trong quá khứ nay không còn nữa.',
    [/\bused\s+to\s+[a-z]+/i],
  ),
  gp(
    'GP_FIRST_CONDITIONAL',
    'first conditional',
    'B1',
    'Câu điều kiện loại 1 (If + hiện tại đơn, will + V) nói về điều kiện có thật ở tương lai.',
    [/\bif\b[^.?!]*\b(will|won't|wo n't)\b/i],
  ),
  gp(
    'GP_MODAL_SHOULD',
    'should for advice',
    'B1',
    'Động từ khuyết thiếu "should" dùng để khuyên nhủ hoặc đưa ra lời khuyên.',
    [/\bshould(n't| not)?\s+[a-z]+/i],
  ),

  // --- B2 ------------------------------------------------------------------
  gp(
    'GP_SECOND_CONDITIONAL',
    'second conditional',
    'B2',
    'Câu điều kiện loại 2 (If + quá khứ đơn, would + V) nói về tình huống không có thật hoặc khó xảy ra ở hiện tại/tương lai.',
    [/\bif\b[^.?!]*\bwould\b/i, /\bif\s+[a-z]+\s+were\b/i],
  ),
  gp(
    'GP_PRESENT_PERFECT_CONTINUOUS',
    'present perfect continuous',
    'B2',
    'Thì hiện tại hoàn thành tiếp diễn (have/has been + V-ing) nhấn mạnh quá trình kéo dài tới hiện tại.',
    [/\b(have|has)\s+been\s+[a-z]+ing\b/i],
  ),
  gp(
    'GP_PASSIVE_VOICE',
    'passive voice',
    'B2',
    'Câu bị động (be + V3) nhấn mạnh vào đối tượng chịu tác động thay vì người thực hiện.',
    [/\b(is|are|was|were|been|be)\s+[a-z]+ed\s+by\b/i, /\b(is|are|was|were)\s+[a-z]+en\b/i],
  ),
  gp(
    'GP_RELATIVE_CLAUSES',
    'relative clauses',
    'B2',
    'Mệnh đề quan hệ (who/which/that...) dùng để bổ nghĩa cho danh từ đứng trước.',
    [/\b\w+\s+(who|which|whom|whose|that)\s+[a-z]+/i],
  ),
  gp(
    'GP_REPORTED_SPEECH',
    'reported speech',
    'B2',
    'Câu tường thuật dùng để thuật lại lời nói của người khác (said that, told...).',
    [/\b(said|told|asked|explained)\s+(that\s+)?[a-z]+/i],
  ),

  // --- C1 ------------------------------------------------------------------
  gp(
    'GP_THIRD_CONDITIONAL',
    'third conditional',
    'C1',
    'Câu điều kiện loại 3 (If + quá khứ hoàn thành, would have + V3) nói về điều trái với quá khứ.',
    [/\bif\b[^.?!]*\b(had)\b[^.?!]*\bwould have\b/i, /\bwould have\s+[a-z]+ed\b/i],
  ),
  gp(
    'GP_INVERSION',
    'inversion for emphasis',
    'C1',
    'Đảo ngữ để nhấn mạnh (Never have I..., Not only...) đưa trợ động từ lên trước chủ ngữ.',
    [/\b(never|rarely|seldom|hardly|not only)\b\s+(have|has|had|do|does|did|will|can)\b/i],
  ),
  gp(
    'GP_MIXED_CONDITIONAL',
    'mixed conditional',
    'C1',
    'Câu điều kiện hỗn hợp kết hợp điều kiện quá khứ với kết quả hiện tại (hoặc ngược lại).',
    [/\bif\b[^.?!]*\bhad\b[^.?!]*\bwould\b(?!\s+have)/i],
  ),
];

/** Fast lookup of a Grammar Inventory entry by its stable id. */
export const GRAMMAR_INVENTORY_BY_ID: ReadonlyMap<string, GrammarInventoryEntry> = new Map(
  GRAMMAR_INVENTORY.map((entry) => [entry.id, entry]),
);
