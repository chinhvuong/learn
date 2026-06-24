import { Injectable } from '@nestjs/common';

import { AnalyzedVocabulary, Analyzer, FetchedContent } from '../../ports/lesson-engine.ports';

/**
 * Fake {@link Analyzer} for the tracer slice — the cheap no-reference stage
 * (ADR-0005). Extracts distinct lowercased words as Vocabulary lemmas (skipping
 * very short stop-words) and stubs the topic/author metadata. A real adapter
 * does proper lemmatization + LLM metadata extraction.
 */
@Injectable()
export class FakeAnalyzer implements Analyzer {
  async analyze(content: FetchedContent): Promise<{
    vocabulary: AnalyzedVocabulary[];
    metadata: { topic: string | null; author: string | null };
  }> {
    const seen = new Set<string>();
    const vocabulary: AnalyzedVocabulary[] = [];

    for (const raw of content.fullText.split(/\s+/)) {
      const lemma = raw.toLowerCase().replace(/[^a-z]/g, '');
      if (lemma.length < 3 || seen.has(lemma)) {
        continue;
      }
      seen.add(lemma);
      vocabulary.push({ lemma, surface: raw.replace(/[^A-Za-z]/g, ''), level: 30 });
    }

    return {
      vocabulary,
      metadata: { topic: 'general', author: content.title },
    };
  }
}
