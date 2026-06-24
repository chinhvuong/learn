import { Module } from '@nestjs/common';

import { ChunkMatcherAdapter } from './adapters/chunk-matcher.adapter';
import { DbSourceCache } from './adapters/fake/db-source-cache.adapter';
import { FakeAnalyzer } from './adapters/fake/fake-analyzer.adapter';
import { FakeContentFetcher } from './adapters/fake/fake-content-fetcher.adapter';
import { FakeCreationCreditService } from './adapters/fake/fake-creation-credit.service';
import { FakeTranslator } from './adapters/fake/fake-translator.adapter';
import { GrammarMatcherAdapter } from './adapters/grammar-matcher.adapter';
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
 * The Grammar and Chunk matchers are now **real** adapters (issue #11) backed
 * by the closed Grammar Inventory and reference Chunk Inventory (ADR-0003 /
 * ADR-0004). The remaining ports (article scraper, LLM analyzer, translation
 * model, Redis cache, billing) are still bound to **faked** adapters and are the
 * seams where real adapters get swapped in later — the engine and its tests
 * never depend on a concrete adapter.
 *
 * Repositories the engine depends on are provided by the global DatabaseModule.
 */
@Module({
  providers: [
    LessonCreationEngine,
    { provide: CONTENT_FETCHER, useClass: FakeContentFetcher },
    { provide: ANALYZER, useClass: FakeAnalyzer },
    { provide: GRAMMAR_MATCHER, useClass: GrammarMatcherAdapter },
    { provide: CHUNK_MATCHER, useClass: ChunkMatcherAdapter },
    { provide: TRANSLATOR, useClass: FakeTranslator },
    { provide: SOURCE_CACHE, useClass: DbSourceCache },
    { provide: CREATION_CREDIT_SERVICE, useClass: FakeCreationCreditService },
  ],
  exports: [LessonCreationEngine],
})
export class LessonsModule {}
