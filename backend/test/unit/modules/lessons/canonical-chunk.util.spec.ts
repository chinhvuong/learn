/// <reference types="jest" />

import { canonicalizeChunk } from '@modules/lessons/utils/canonical-chunk.util';

/**
 * Canonical Chunk normalization is mandatory (ADR-0004): surface variants of a
 * Chunk must collapse to one canonical lemmatized form so they count, review,
 * and dedup as a single entity.
 */
describe('canonicalizeChunk', () => {
  it('collapses inflected variants of a light-verb collocation to one canonical form', () => {
    const variants = [
      'make a decision',
      'making a decision',
      'makes decisions',
      'made the decision',
    ];
    const canonical = variants.map(canonicalizeChunk);
    // Every variant maps to the SAME canonical form (ADR-0004).
    expect(new Set(canonical).size).toBe(1);
    expect(canonical[0]).toBe('make decision');
  });

  it('drops articles so a/an/the never split a Chunk variant', () => {
    expect(canonicalizeChunk('make a decision')).toBe('make decision');
    expect(canonicalizeChunk('make the decision')).toBe('make decision');
    expect(canonicalizeChunk('make decision')).toBe('make decision');
  });

  it('lemmatizes phrasal-verb inflections to the base verb', () => {
    const variants = ['give up', 'gives up', 'giving up', 'gave up'];
    expect(new Set(variants.map(canonicalizeChunk)).size).toBe(1);
    expect(canonicalizeChunk('giving up')).toBe('give up');
  });

  it('strips punctuation and normalizes whitespace and case', () => {
    expect(canonicalizeChunk('  Look   Forward  TO! ')).toBe('look forward to');
  });

  it('is idempotent — canonicalizing a canonical form returns it unchanged', () => {
    const canonical = canonicalizeChunk('taking care of');
    expect(canonicalizeChunk(canonical)).toBe(canonical);
  });
});
