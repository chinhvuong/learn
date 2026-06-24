import { Injectable } from '@nestjs/common';

import { GRAMMAR_INVENTORY } from '../inventory';
import { FetchedContent, GrammarMatch, GrammarMatcher } from '../ports/lesson-engine.ports';

/**
 * Real {@link GrammarMatcher} (ADR-0003): classifies a Source's sentences
 * against the **closed Grammar Inventory** — it never generates free-form
 * grammar. Every match resolves to a stable Inventory id, which is what makes
 * Grammar Points countable, reviewable, dedup-able and Level-aware.
 *
 * Algorithm: split the full text into sentences, then for each Inventory entry
 * test its classification matchers against each sentence. A point that fires in
 * any sentence is reported once (deduped by Inventory id), carrying the first
 * matched surface, the authored Vietnamese explanation's Level, and the stable
 * id. This is pure pattern-classification against the catalog; a future adapter
 * can swap the regex layer for an LLM classifier behind this same port, but it
 * must still resolve to an Inventory id (the closed-catalog invariant, ADR-0003).
 */
@Injectable()
export class GrammarMatcherAdapter implements GrammarMatcher {
  async match(content: FetchedContent): Promise<GrammarMatch[]> {
    const sentences = splitSentences(content.fullText);

    // Dedup by stable Inventory id — a point seen across many sentences is one
    // Grammar Point (counted once, CONTEXT.md dedup rule).
    const byId = new Map<string, GrammarMatch>();

    for (const entry of GRAMMAR_INVENTORY) {
      for (const sentence of sentences) {
        const surface = firstMatch(entry.matchers, sentence);
        if (surface !== null && !byId.has(entry.id)) {
          byId.set(entry.id, {
            inventoryId: entry.id,
            lemma: entry.name,
            surface,
            level: entry.level,
          });
          break; // one match per point is enough — it is one Grammar Point
        }
      }
    }

    return [...byId.values()];
  }
}

/** Split text into sentences on terminal punctuation, keeping non-empty trimmed pieces. */
function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Return the first matched surface string from any of the patterns, or null. */
function firstMatch(patterns: RegExp[], sentence: string): string | null {
  for (const pattern of patterns) {
    const found = sentence.match(pattern);
    if (found) {
      return found[0].trim();
    }
  }
  return null;
}
