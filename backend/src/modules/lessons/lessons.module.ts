import { Module } from '@nestjs/common';

import { DbSourceCache } from './adapters/fake/db-source-cache.adapter';
import { FakeAnalyzer } from './adapters/fake/fake-analyzer.adapter';
import { FakeChunkMatcher } from './adapters/fake/fake-chunk-matcher.adapter';
import { FakeContentFetcher } from './adapters/fake/fake-content-fetcher.adapter';
import { FakeCreationCreditService } from './adapters/fake/fake-creation-credit.service';
import { FakeGrammarMatcher } from './adapters/fake/fake-grammar-matcher.adapter';
import { FakeTranslator } from './adapters/fake/fake-translator.adapter';
import {
  ANALYZER,
  CHUNK_MATCHER,
  CONTENT_FETCHER,
  CREATION_CREDIT_SERVICE,
  GRAMMAR_MATCHER,
  SOURCE_CACHE,
  TRANSLATOR,
} from './ports/lesson-engine.ports';
import { LessonCreationEngine } from './services/lesson-creation-engine.service';

/**
 * Lesson Creation Engine module (issue #3) — the tracer-bullet vertical slice
 * that turns a Source into Lessons.
 *
 * Every external port is bound to a **faked** adapter for this slice (ADR-0005
 * staged pipeline with all adapters faked). The bindings are the single seam
 * where real adapters (article scraper, LLM analyzer, Grammar/Chunk matchers,
 * translation model, Redis cache, billing) will be swapped in later — the
 * engine and its tests never depend on a concrete adapter.
 *
 * Repositories the engine depends on are provided by the global DatabaseModule.
 */
@Module({
  providers: [
    LessonCreationEngine,
    { provide: CONTENT_FETCHER, useClass: FakeContentFetcher },
    { provide: ANALYZER, useClass: FakeAnalyzer },
    { provide: GRAMMAR_MATCHER, useClass: FakeGrammarMatcher },
    { provide: CHUNK_MATCHER, useClass: FakeChunkMatcher },
    { provide: TRANSLATOR, useClass: FakeTranslator },
    { provide: SOURCE_CACHE, useClass: DbSourceCache },
    { provide: CREATION_CREDIT_SERVICE, useClass: FakeCreationCreditService },
  ],
  exports: [LessonCreationEngine],
})
export class LessonsModule {}
