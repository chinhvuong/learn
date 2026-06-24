import { Injectable } from '@nestjs/common';

import { GrammarMatch, GrammarMatcher, FetchedContent } from '../../ports/lesson-engine.ports';

/**
 * Fake {@link GrammarMatcher} for the tracer slice. Classifies against a tiny
 * stand-in Grammar Inventory (ADR-0003 — classify, never generate): it emits a
 * fixed Inventory entry when the matching pattern appears in the text. A real
 * adapter classifies sentences against the full ~150–250-entry Inventory.
 */
@Injectable()
export class FakeGrammarMatcher implements GrammarMatcher {
  /** Stand-in slice of the closed Grammar Inventory. */
  private static readonly INVENTORY = [
    {
      inventoryId: 'GP_PRESENT_PERFECT',
      pattern: /\bhas\b|\bhave\b/i,
      lemma: 'present perfect',
      level: 45,
    },
    { inventoryId: 'GP_USED_TO', pattern: /\bused to\b/i, lemma: 'used to + V', level: 40 },
  ];

  async match(content: FetchedContent): Promise<GrammarMatch[]> {
    const matches: GrammarMatch[] = [];
    for (const entry of FakeGrammarMatcher.INVENTORY) {
      const found = content.fullText.match(entry.pattern);
      if (found) {
        matches.push({
          inventoryId: entry.inventoryId,
          lemma: entry.lemma,
          surface: found[0],
          level: entry.level,
        });
      }
    }
    return matches;
  }
}
