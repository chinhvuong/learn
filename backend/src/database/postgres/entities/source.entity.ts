import { Column, Entity, Index } from 'typeorm';

import { SourceType } from '@modules/lessons/constants/lesson.constants';

import { AbstractEntity } from './abstract.entity';

/**
 * A Source — the raw original content a Lesson is built from (CONTEXT.md →
 * Source): an article, podcast, YouTube video, or pasted text.
 *
 * Source identity is the **hybrid fingerprint** (ADR-0001): `normalizedUrl` is
 * the cheap fast-path dedup key, `contentHash` is the authoritative key (dedups
 * the same content across URLs, and pasted text matching a known Source). One
 * of the two matching yields a cache hit and skips re-analysis.
 *
 * Per ADR-0001 the derived layer (Candidate Items, level/topic tags,
 * timestamps) is shareable; the full Bilingual Passage text lives on the
 * importer-private {@link LessonEntity} and is never shared. Only public-URL
 * Sources can become `poolEligible`; private text/file Sources never do.
 */
@Entity('sources')
@Index('idx_sources_content_hash', ['contentHash'], { unique: true })
@Index('idx_sources_normalized_url', ['normalizedUrl'], {
  unique: true,
  where: 'normalized_url IS NOT NULL',
})
export class SourceEntity extends AbstractEntity {
  @Column({ name: 'type', type: 'text' })
  type: SourceType;

  @Column({ name: 'title', type: 'text', nullable: true })
  title: string | null;

  /**
   * Normalized URL — the fast-path half of the hybrid identity (ADR-0001).
   * Null for private pasted-text Sources, which have no URL.
   */
  @Column({ name: 'normalized_url', type: 'text', nullable: true })
  normalizedUrl: string | null;

  /**
   * Content-hash of the normalized extracted text — the authoritative half of
   * the hybrid identity (ADR-0001). Always present; unique across Sources.
   */
  @Column({ name: 'content_hash', type: 'text' })
  contentHash: string;

  @Column({ name: 'language', type: 'text', default: 'en' })
  language: string;

  /** Estimated duration of the Source in seconds; drives Lesson segmentation. */
  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds: number;

  /** Topic tag — shared derived metadata used by recommendation matching. */
  @Column({ name: 'topic', type: 'text', nullable: true })
  topic: string | null;

  /** Author / source-name tag — shared derived metadata. */
  @Column({ name: 'author', type: 'text', nullable: true })
  author: string | null;

  /**
   * Whether this Source's derived layer is eligible for the shared
   * recommendation pool (ADR-0001). Always false for private text/file Sources;
   * for public-URL Sources it starts false and is promoted later by moderation
   * + broad-value gating.
   */
  @Column({ name: 'pool_eligible', type: 'boolean', default: false })
  poolEligible: boolean;
}
