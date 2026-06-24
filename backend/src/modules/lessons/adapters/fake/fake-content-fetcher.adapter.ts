import { Injectable } from '@nestjs/common';

import { SourceType, WORDS_PER_MINUTE } from '../../constants/lesson.constants';
import { ContentFetcher, FetchedContent, SourceInput } from '../../ports/lesson-engine.ports';
import { normalizeUrl } from '../../utils/source-fingerprint.util';

/**
 * Fake {@link ContentFetcher} for this tracer slice (issue #3). For a pasted
 * TEXT Source it normalizes the text inline; for URL Sources it echoes a stub
 * body. Real adapters (article scraper, YouTube transcript, ASR) replace this.
 *
 * Duration is estimated from word count (~{@link WORDS_PER_MINUTE} wpm) when not
 * provided, so a long pasted text segments into multiple Lessons.
 */
@Injectable()
export class FakeContentFetcher implements ContentFetcher {
  async fetch(input: SourceInput): Promise<FetchedContent> {
    const fullText = (input.text ?? '').trim();

    if (input.type === SourceType.TEXT && !fullText) {
      throw new Error('Empty text Source');
    }

    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.max(1, Math.round((wordCount / WORDS_PER_MINUTE) * 60));

    return {
      type: input.type,
      title: input.title ?? null,
      normalizedUrl: normalizeUrl(input.url),
      fullText,
      language: input.language ?? 'en',
      durationSeconds,
    };
  }
}
