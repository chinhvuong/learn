import { Injectable } from '@nestjs/common';

import { ItemConfidence } from '../constants/lesson.constants';
import { CHUNK_INVENTORY } from '../inventory';
import { ChunkMatch, ChunkMatcher, FetchedContent } from '../ports/lesson-engine.ports';
import { canonicalizeChunk } from '../utils/canonical-chunk.util';

/**
 * Real {@link ChunkMatcher} (ADR-0004): hybrid Chunk detection.
 *
 *  1. ANCHORED — match the Source text against the reference Chunk Inventory.
 *     Each hit is a high-confidence Chunk with a stable Inventory id, authored
 *     Vietnamese explanation, and CEFR/Level.
 *  2. CANDIDATE — surface novel collocations the Inventory does not cover as
 *     lower-confidence candidates (no Inventory id). In production this is the
 *     LLM-detection stage of the pipeline; here it is a small deterministic
 *     collocation heuristic standing in behind the same port, so the wiring,
 *     canonicalization, and tiering are all REAL. (HITL: promoting frequent
 *     candidates into the Inventory is a separate curation step, ADR-0004.)
 *
 * **Every** Chunk — anchored or candidate — is normalized to a canonical
 * lemmatized form via {@link canonicalizeChunk} (mandatory, ADR-0004), and the
 * result is deduped by that canonical form so surface variants (`make/making a
 * decision`) collapse to one entity. Anchored wins over candidate on a tie.
 */
@Injectable()
export class ChunkMatcherAdapter implements ChunkMatcher {
  /**
   * Light-verb + noun collocation templates used by the stand-in LLM-detection
   * stage to surface novel candidates not in the reference Inventory. Each fires
   * a lower-confidence candidate with no Inventory id (ADR-0004).
   */
  private static readonly CANDIDATE_PATTERNS: { pattern: RegExp; level: number }[] = [
    // light verb + (optional article + optional adjective) + noun. The optional
    // adjective slot lets `have a big impact` match; the matched surface is then
    // canonicalized (article dropped, verb lemmatized) into the candidate lemma.
    {
      pattern:
        /\b(have|having|has|had)\s+(?:a\s+|an\s+|the\s+)?(?:[a-z]+\s+)?(impact|effect|influence)\b/i,
      level: 58,
    },
    {
      pattern:
        /\b(tak(?:e|es|ing)|took)\s+(?:a\s+|the\s+)?(?:[a-z]+\s+)?(risk|risks|break|breaks|step)\b/i,
      level: 50,
    },
    {
      pattern: /\b(do|doing|does|did)\s+(?:the\s+)?(?:[a-z]+\s+)?(research|homework|laundry)\b/i,
      level: 42,
    },
    {
      pattern:
        /\b(rais(?:e|es|ing)|raised)\s+(?:a\s+|an\s+|the\s+)?(?:[a-z]+\s+)?(question|concern|issue)\b/i,
      level: 58,
    },
  ];

  async match(content: FetchedContent): Promise<ChunkMatch[]> {
    // Keyed by canonical lemmatized form (the dedup key, ADR-0004).
    const byCanonical = new Map<string, ChunkMatch>();

    // --- 1. Anchored Chunks from the reference Inventory --------------------
    for (const entry of CHUNK_INVENTORY) {
      const surface = firstMatch(entry.matchers, content.fullText);
      if (surface === null) {
        continue;
      }
      // Canonical form is authored on the entry; assert-by-construction that the
      // matched surface canonicalizes to it is enforced in the spec.
      const match: ChunkMatch = {
        inventoryId: entry.id,
        lemma: entry.canonical,
        surface,
        confidence: ItemConfidence.ANCHORED,
        level: entry.level,
      };
      byCanonical.set(entry.canonical, match);
    }

    // --- 2. Novel candidates (LLM-detection stand-in) ----------------------
    for (const { pattern, level } of ChunkMatcherAdapter.CANDIDATE_PATTERNS) {
      const found = content.fullText.match(pattern);
      if (!found) {
        continue;
      }
      const surface = found[0].trim();
      const canonical = canonicalizeChunk(surface);
      if (byCanonical.has(canonical)) {
        // Already covered by a higher-confidence anchored Chunk — keep the anchor.
        continue;
      }
      byCanonical.set(canonical, {
        inventoryId: null,
        lemma: canonical,
        surface,
        confidence: ItemConfidence.CANDIDATE,
        level,
      });
    }

    return [...byCanonical.values()];
  }
}

/** Return the first matched surface string from any of the patterns, or null. */
function firstMatch(patterns: RegExp[], text: string): string | null {
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      return found[0].trim();
    }
  }
  return null;
}
