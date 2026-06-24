/**
 * Canonical Chunk normalization (ADR-0004).
 *
 * Every Chunk — whether matched against the reference Chunk Inventory or
 * surfaced by the LLM as a novel candidate — is normalized to a **canonical
 * lemmatized form** so surface variants (`make a decision` / `making decisions`)
 * collapse to one stable entity for counting, SRS, and dedup. This is mandatory
 * (ADR-0004), so it lives in one shared util both matchers call.
 *
 * This is a deliberately small, dependency-free lemmatizer tuned for the kinds
 * of multi-word expressions Chunks are (phrasal verbs, light-verb + noun
 * collocations, prepositional idioms). A heavier morphological lemmatizer can be
 * swapped in behind this same function later; the *contract* — same canonical
 * form for all variants of a Chunk — is what the rest of the engine relies on.
 */

/** Common English stop-articles dropped so `a/an/the` never split a Chunk variant. */
const DROPPED_ARTICLES = new Set(['a', 'an', 'the']);

/**
 * Irregular verb lemmas keyed by inflected surface form. Covers the high-frequency
 * irregulars that appear in everyday Chunks (light-verb collocations especially).
 * Regular inflections are handled by the suffix rules below.
 */
const IRREGULAR_VERBS: Readonly<Record<string, string>> = {
  made: 'make',
  making: 'make',
  makes: 'make',
  took: 'take',
  taken: 'take',
  taking: 'take',
  takes: 'take',
  gave: 'give',
  given: 'give',
  giving: 'give',
  gives: 'give',
  got: 'get',
  gotten: 'get',
  getting: 'get',
  gets: 'get',
  came: 'come',
  coming: 'come',
  comes: 'come',
  went: 'go',
  gone: 'go',
  going: 'go',
  goes: 'go',
  had: 'have',
  having: 'have',
  has: 'have',
  kept: 'keep',
  keeping: 'keep',
  keeps: 'keep',
  paid: 'pay',
  paying: 'pay',
  pays: 'pay',
  put: 'put',
  putting: 'put',
  puts: 'put',
  ran: 'run',
  running: 'run',
  runs: 'run',
  broke: 'break',
  broken: 'break',
  breaking: 'break',
  breaks: 'break',
};

/**
 * Re-add a silent `e` dropped before `-ing`/`-ed` (mak -> make, decid -> decide)
 * for stems that conventionally take one. Heuristic but stable: all that matters
 * is that every variant maps to the SAME canonical token, which they do.
 */
function restoreSilentE(stem: string): string {
  if (stem.length < 2) {
    return stem;
  }
  // Stems ending in a consonant after a single vowel usually had a silent e.
  if (/[bcdgklmnprstvz]$/.test(stem) && /[aeiou][^aeiou]$/.test(stem)) {
    return `${stem}e`;
  }
  return stem;
}

/**
 * Lemmatize a single token with a tiny rule set: irregulars first, then the
 * regular `-ing` / `-ed` / plural-or-3sg `-s` suffix rules. Words shorter than 4
 * characters are left untouched (too short to safely strip a suffix).
 */
function lemmatizeToken(token: string): string {
  if (IRREGULAR_VERBS[token]) {
    return IRREGULAR_VERBS[token];
  }
  if (token.length < 4) {
    return token;
  }
  // -ing: making -> mak(e).
  if (token.endsWith('ing')) {
    return restoreSilentE(token.slice(0, -3));
  }
  // -ed: decided -> decid(e), worked -> work.
  if (token.endsWith('ed')) {
    return restoreSilentE(token.slice(0, -2));
  }
  // plural / 3rd-person-singular -s.
  if (token.endsWith('ies')) {
    return `${token.slice(0, -3)}y`; // stories -> story
  }
  if (token.endsWith('es') && /(s|x|z|ch|sh)es$/.test(token)) {
    return token.slice(0, -2); // boxes -> box, watches -> watch
  }
  if (token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1); // decisions -> decision
  }
  return token;
}

/**
 * Normalize a Chunk surface form to its canonical lemmatized form (ADR-0004).
 *
 * Steps: lowercase, strip punctuation, drop articles, lemmatize each remaining
 * token, then re-join. `making a decision`, `makes decisions`, and `made a
 * decision` all canonicalize to `make decision`.
 */
export function canonicalizeChunk(surface: string): string {
  const tokens = surface
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !DROPPED_ARTICLES.has(token));

  return tokens.map(lemmatizeToken).join(' ').trim();
}
