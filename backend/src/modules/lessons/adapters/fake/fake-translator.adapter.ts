import { Injectable } from '@nestjs/common';

import { FetchedContent, Translator } from '../../ports/lesson-engine.ports';

/**
 * Fake {@link Translator} for the tracer slice — the expensive bilingual stage
 * (ADR-0005), cached in the importer-private layer (ADR-0001). Returns a stub
 * Native-Language (Vietnamese) rendering; a real adapter calls a translation
 * model and caches the Bilingual Passage on its own key.
 */
@Injectable()
export class FakeTranslator implements Translator {
  async translate(content: FetchedContent): Promise<string> {
    return `[vi] ${content.fullText}`;
  }
}
