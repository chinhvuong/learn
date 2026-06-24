/**
 * The reference Chunk Inventory (ADR-0004 / CONTEXT.md → Chunk).
 *
 * Chunks are detected by a **hybrid** approach: this curated reference Inventory
 * provides high-confidence **anchored** Chunks (stable id + authored explanation
 * + CEFR/Level), while the {@link ChunkMatcher} additionally surfaces novel
 * collocations the LLM finds as lower-confidence **candidates** (no Inventory
 * id). Both tiers are normalized to a **canonical lemmatized form** (mandatory,
 * ADR-0004) so variants like `make/making a decision` collapse to one entity.
 *
 * Each entry carries:
 *  - `id`        — stable, human-readable, prefixed `CH_`. Never reused/renamed.
 *  - `canonical` — the canonical lemmatized form (the dedup key, ADR-0004).
 *  - `cefr`      — the CEFR band this Chunk is introduced at.
 *  - `level`     — the fine 0–100 Level score (CONTEXT.md → Level).
 *  - `explanationVi` — the ONE authored-once Vietnamese (Native Language)
 *                explanation. Real product copy — do not translate elsewhere.
 *  - `matchers`  — surface-form patterns that detect inflected variants of the
 *                Chunk in a Source's text. The matched surface is then run
 *                through {@link canonicalizeChunk}; a build-time check (see
 *                chunk-inventory.spec) asserts it equals `canonical`.
 *
 * HITL / DEFERRED: a production Inventory is a large, continuously-curated
 * authored-content asset (ADR-0004). This file seeds a **representative starter
 * slice** across CEFR bands using the production schema; full curation (the long
 * tail of collocations / phrasal verbs / idioms + reviewed Vietnamese copy) is a
 * Human-In-The-Loop task tracked separately. Structure + correctness here matter
 * more than count.
 */

import { CEFR_TO_LEVEL, CefrBand } from './cefr';

/** One stable entry in the reference Chunk Inventory. */
export interface ChunkInventoryEntry {
  /** Stable Inventory id, prefixed `CH_`. Never renamed or reused. */
  id: string;
  /** Canonical lemmatized form — the dedup key (ADR-0004). */
  canonical: string;
  /** CEFR band the Chunk is introduced at. */
  cefr: CefrBand;
  /** Fine 0–100 Level score derived from the CEFR band. */
  level: number;
  /** The one authored-once Vietnamese (Native Language) explanation. */
  explanationVi: string;
  /** Surface-form detection patterns (cover inflected variants). */
  matchers: RegExp[];
}

/**
 * Build an entry, deriving the fine Level from the CEFR band so the two never
 * drift. Keeps the seed table below terse and consistent.
 */
function ch(
  id: string,
  canonical: string,
  cefr: CefrBand,
  explanationVi: string,
  matchers: RegExp[],
): ChunkInventoryEntry {
  return { id, canonical, cefr, level: CEFR_TO_LEVEL[cefr], explanationVi, matchers };
}

/**
 * The seeded reference Chunk Inventory slice — high-confidence anchors with
 * stable ids (ADR-0004). Canonical forms are lemmatized (articles dropped, verbs
 * to base form) to match {@link canonicalizeChunk}'s output exactly.
 */
export const CHUNK_INVENTORY: readonly ChunkInventoryEntry[] = [
  // --- A2 ------------------------------------------------------------------
  ch('CH_GIVE_UP', 'give up', 'A2', 'Phrasal verb "give up": từ bỏ, không cố gắng tiếp nữa.', [
    /\bgiv(e|es|ing|en)?\s+up\b/i,
    /\bgave\s+up\b/i,
  ]),
  ch('CH_LOOK_FOR', 'look for', 'A2', 'Phrasal verb "look for": tìm kiếm cái gì đó.', [
    /\blook(s|ing|ed)?\s+for\b/i,
  ]),
  ch(
    'CH_PICK_UP',
    'pick up',
    'A2',
    'Phrasal verb "pick up": nhặt lên, đón ai đó, hoặc học được điều gì một cách tự nhiên.',
    [/\bpick(s|ing|ed)?\s+up\b/i, /\bpicked\s+up\b/i],
  ),

  // --- B1 ------------------------------------------------------------------
  ch(
    'CH_MAKE_DECISION',
    'make decision',
    'B1',
    'Cụm "make a decision": đưa ra một quyết định. (Lưu ý: dùng "make", không dùng "do".)',
    [/\bmak(e|es|ing)\s+(a\s+|the\s+)?decisions?\b/i, /\bmade\s+(a\s+|the\s+)?decisions?\b/i],
  ),
  ch(
    'CH_LOOK_FORWARD_TO',
    'look forward to',
    'B1',
    'Cụm "look forward to + V-ing/N": mong chờ, háo hức điều gì sắp tới.',
    [/\blook(s|ing|ed)?\s+forward\s+to\b/i],
  ),
  ch(
    'CH_TAKE_CARE_OF',
    'take care of',
    'B1',
    'Cụm "take care of": chăm sóc, lo liệu cho ai/cái gì.',
    [/\btak(e|es|ing)\s+care\s+of\b/i, /\btook\s+care\s+of\b/i],
  ),
  ch('CH_KEEP_IN_MIND', 'keep in mind', 'B1', 'Cụm "keep in mind": ghi nhớ, lưu ý điều gì đó.', [
    /\bkeep(s|ing)?\s+in\s+mind\b/i,
    /\bkept\s+in\s+mind\b/i,
  ]),

  // --- B2 ------------------------------------------------------------------
  ch(
    'CH_PAY_ATTENTION_TO',
    'pay attention to',
    'B2',
    'Cụm "pay attention to": chú ý, để tâm đến điều gì.',
    [/\bpay(s|ing)?\s+attention\s+to\b/i, /\bpaid\s+attention\s+to\b/i],
  ),
  ch(
    'CH_TAKE_INTO_ACCOUNT',
    'take into account',
    'B2',
    'Cụm "take into account": cân nhắc, tính đến yếu tố nào đó.',
    [/\btak(e|es|ing)\s+into\s+account\b/i, /\btook\s+into\s+account\b/i],
  ),
  ch(
    'CH_COME_UP_WITH',
    'come up with',
    'B2',
    'Phrasal verb "come up with": nghĩ ra, đưa ra (ý tưởng, giải pháp).',
    [/\bcom(e|es|ing)\s+up\s+with\b/i, /\bcame\s+up\s+with\b/i],
  ),

  // --- C1 ------------------------------------------------------------------
  ch(
    'CH_BEAR_IN_MIND',
    'bear in mind',
    'C1',
    'Cụm "bear in mind": ghi nhớ, lưu tâm (trang trọng hơn "keep in mind").',
    [/\bbear(s|ing)?\s+in\s+mind\b/i, /\bbore\s+in\s+mind\b/i],
  ),
];

/** Fast lookup of a Chunk Inventory entry by its stable id. */
export const CHUNK_INVENTORY_BY_ID: ReadonlyMap<string, ChunkInventoryEntry> = new Map(
  CHUNK_INVENTORY.map((entry) => [entry.id, entry]),
);
