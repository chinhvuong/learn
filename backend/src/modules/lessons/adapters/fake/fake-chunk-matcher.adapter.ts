import { Injectable } from '@nestjs/common';

import { ItemConfidence } from '../../constants/lesson.constants';
import { ChunkMatch, ChunkMatcher, FetchedContent } from '../../ports/lesson-engine.ports';

/**
 * Fake {@link ChunkMatcher} for the tracer slice. Hybrid (ADR-0004): anchored
 * Chunks from a stand-in reference Inventory (stable id + canonical lemmatized
 * form) plus a lower-confidence novel candidate. Every Chunk is normalized to a
 * canonical lemmatized form (mandatory, ADR-0004).
 */
@Injectable()
export class FakeChunkMatcher implements ChunkMatcher {
  /** Stand-in slice of the reference Chunk Inventory (canonical lemmatized forms). */
  private static readonly INVENTORY = [
    {
      inventoryId: 'CH_GIVE_UP',
      pattern: /\bgiv(e|ing|es|en)?\s+up\b/i,
      lemma: 'give up',
      level: 35,
    },
    {
      inventoryId: 'CH_MAKE_A_DECISION',
      pattern: /\bmak(e|ing|es)\s+a?\s*decisions?\b/i,
      lemma: 'make a decision',
      level: 40,
    },
  ];

  async match(content: FetchedContent): Promise<ChunkMatch[]> {
    const matches: ChunkMatch[] = [];

    // Anchored Chunks from the reference Inventory.
    for (const entry of FakeChunkMatcher.INVENTORY) {
      const found = content.fullText.match(entry.pattern);
      if (found) {
        matches.push({
          inventoryId: entry.inventoryId,
          lemma: entry.lemma,
          surface: found[0].trim(),
          confidence: ItemConfidence.ANCHORED,
          level: entry.level,
        });
      }
    }

    // A novel LLM-detected candidate (lower confidence, no Inventory id).
    const novel = content.fullText.match(/\blook(s|ing|ed)?\s+forward\s+to\b/i);
    if (novel) {
      matches.push({
        inventoryId: null,
        lemma: 'look forward to',
        surface: novel[0].trim(),
        confidence: ItemConfidence.CANDIDATE,
        level: 50,
      });
    }

    return matches;
  }
}
