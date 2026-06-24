import { createHash } from 'crypto';

/**
 * The hybrid Source identity (ADR-0001): a normalized URL fast-path plus an
 * authoritative content-hash. Near-duplicate / fuzzy matching is deferred.
 */

/**
 * Normalize a URL to the cheap fast-path dedup key (ADR-0001): lowercased host,
 * no trailing slash, no fragment, common tracking params stripped. Returns null
 * for input without a URL (pasted text / files).
 */
export function normalizeUrl(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();

  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  for (const param of trackingParams) {
    parsed.searchParams.delete(param);
  }
  parsed.searchParams.sort();

  let normalized = parsed.toString();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * The authoritative dedup key (ADR-0001): a content-hash of the normalized
 * extracted text. Whitespace is collapsed and lowercased so trivial formatting
 * differences (and pasted text matching a known Source) collapse to one hash.
 */
export function hashContent(fullText: string): string {
  const normalizedText = fullText.replace(/\s+/g, ' ').trim().toLowerCase();
  return createHash('sha256').update(normalizedText).digest('hex');
}
