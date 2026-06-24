/// <reference types="jest" />

import { hashContent, normalizeUrl } from '@modules/lessons/utils/source-fingerprint.util';

describe('normalizeUrl', () => {
  it('returns null for missing input', () => {
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
  });

  it('strips trailing slash and fragment, lowercases host', () => {
    expect(normalizeUrl('https://Example.com/Post/#section')).toBe('https://example.com/Post');
  });

  it('strips tracking params and sorts the rest so equivalent URLs collapse', () => {
    expect(normalizeUrl('https://ex.com/p?utm_source=tw&b=2&a=1')).toBe('https://ex.com/p?a=1&b=2');
  });
});

describe('hashContent', () => {
  it('is whitespace- and case-insensitive (pasted text collapses to one hash)', () => {
    expect(hashContent('Make A   Decision')).toBe(hashContent('make a decision'));
  });

  it('differs for genuinely different content', () => {
    expect(hashContent('one')).not.toBe(hashContent('two'));
  });
});
