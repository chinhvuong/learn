import { Injectable } from '@nestjs/common';

import { SourcesRepository } from '@database/postgres';

import { SourceCache } from '../../ports/lesson-engine.ports';

/**
 * {@link SourceCache} backed by the `sources` table. A Source is "cached" once
 * its shared derived layer is persisted; lookup matches the hybrid fingerprint
 * (ADR-0001) — content-hash (authoritative) OR normalized URL (fast path).
 *
 * This is the real persistence-backed adapter for the tracer slice; a Redis
 * front cache can layer in front of it later without changing the port.
 */
@Injectable()
export class DbSourceCache implements SourceCache {
  constructor(private readonly sources: SourcesRepository) {}

  async lookup(contentHash: string, normalizedUrl: string | null): Promise<string | null> {
    const existing = await this.sources.findByFingerprint(contentHash, normalizedUrl);
    return existing?.id ?? null;
  }
}
