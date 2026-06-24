/// <reference types="jest" />

import { ChunkMatcherAdapter } from '@modules/lessons/adapters/chunk-matcher.adapter';
import { ItemConfidence, SourceType } from '@modules/lessons/constants/lesson.constants';
import { CHUNK_INVENTORY_BY_ID } from '@modules/lessons/inventory';
import { FetchedContent } from '@modules/lessons/ports/lesson-engine.ports';
import { canonicalizeChunk } from '@modules/lessons/utils/canonical-chunk.util';

/**
 * The real ChunkMatcher is hybrid (ADR-0004): anchored Chunks from the reference
 * Inventory (stable id, ANCHORED) plus lower-confidence novel candidates (no
 * id, CANDIDATE). Every Chunk is normalized to a canonical lemmatized form so
 * variants collapse to one entity.
 */
const content = (fullText: string): FetchedContent => ({
  type: SourceType.TEXT,
  title: null,
  normalizedUrl: null,
  fullText,
  language: 'en',
  durationSeconds: 60,
});

describe('ChunkMatcherAdapter', () => {
  const matcher = new ChunkMatcherAdapter();

  it('matches an anchored Chunk to its stable Inventory id with ANCHORED confidence', async () => {
    const matches = await matcher.match(content('She finally made a decision.'));
    const chunk = matches.find((m) => m.inventoryId === 'CH_MAKE_DECISION');
    expect(chunk).toBeDefined();
    expect(chunk?.confidence).toBe(ItemConfidence.ANCHORED);
    expect(chunk?.lemma).toBe('make decision');
    expect(chunk?.level).toBe(CHUNK_INVENTORY_BY_ID.get('CH_MAKE_DECISION')?.level);
  });

  it('canonicalizes every Chunk so surface variants collapse to one entity', async () => {
    // "making a decision" and "made the decision" are variants of the same Chunk.
    const a = await matcher.match(content('He is making a decision now.'));
    const b = await matcher.match(content('He made the decision yesterday.'));
    const lemmaA = a.find((m) => m.inventoryId === 'CH_MAKE_DECISION')?.lemma;
    const lemmaB = b.find((m) => m.inventoryId === 'CH_MAKE_DECISION')?.lemma;
    expect(lemmaA).toBe('make decision');
    expect(lemmaB).toBe('make decision');
    expect(lemmaA).toBe(lemmaB);
  });

  it('tiers a novel collocation as a lower-confidence CANDIDATE with no Inventory id', async () => {
    const matches = await matcher.match(content('The new policy will have a big impact.'));
    const candidate = matches.find((m) => m.confidence === ItemConfidence.CANDIDATE);
    expect(candidate).toBeDefined();
    expect(candidate?.inventoryId).toBeNull();
    // Candidate lemma is also canonicalized (mandatory, ADR-0004).
    expect(candidate?.lemma).toBe(canonicalizeChunk(candidate!.surface));
  });

  it('produces both tiers from one Source (anchored + candidate)', async () => {
    const matches = await matcher.match(
      content('They made a decision and it will have a big impact.'),
    );
    const tiers = new Set(matches.map((m) => m.confidence));
    expect(tiers.has(ItemConfidence.ANCHORED)).toBe(true);
    expect(tiers.has(ItemConfidence.CANDIDATE)).toBe(true);
  });

  it('every Chunk lemma equals its canonical lemmatized form', async () => {
    const matches = await matcher.match(
      content('We should take care of it and come up with a plan and look forward to summer.'),
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.lemma).toBe(canonicalizeChunk(match.lemma));
    }
  });

  it('deduplicates by canonical form (one entity per canonical Chunk)', async () => {
    const matches = await matcher.match(
      content('She made a decision. He made another decision. They are making decisions.'),
    );
    const decisionChunks = matches.filter((m) => m.lemma === 'make decision');
    expect(decisionChunks).toHaveLength(1);
  });
});
