import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from './abstract.entity';

/**
 * A Lesson — the analyzed, packaged learning unit produced from a Source
 * (CONTEXT.md → Lesson). Its **common core** is its Items (stored as
 * {@link ItemEntity} rows), a Bilingual Passage, and the original text.
 *
 * A Source produces one Lesson by default and is auto-segmented into several
 * Lessons only when it exceeds the ~3–5 minute target (CONTEXT.md →
 * Relationships); `segmentIndex` orders the segments within a Source.
 *
 * `bilingualPassage` and `originalText` are the **importer-private** full text
 * (ADR-0001) — the shared derived layer (Candidate Items, tags) lives on the
 * Source, never here.
 */
@Entity('lessons')
@Index('idx_lessons_source', ['sourceId'])
@Index('idx_lessons_source_segment', ['sourceId', 'segmentIndex'], { unique: true })
export class LessonEntity extends AbstractEntity {
  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({ name: 'title', type: 'text', nullable: true })
  title: string | null;

  /** Zero-based order of this Lesson among the segments of its Source. */
  @Column({ name: 'segment_index', type: 'integer', default: 0 })
  segmentIndex: number;

  /** Estimated study length of this Lesson in seconds (~3–5 min target). */
  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds: number;

  /**
   * The original Target-Language text of this Lesson segment. Importer-private
   * (ADR-0001): never part of the shared derived layer.
   */
  @Column({ name: 'original_text', type: 'text' })
  originalText: string;

  /**
   * The Bilingual Passage: the on-demand Native-Language translation surface
   * (CONTEXT.md → Bilingual Passage). Importer-private (ADR-0001), cached in
   * the private layer separately from analysis (ADR-0005).
   */
  @Column({ name: 'bilingual_passage', type: 'text' })
  bilingualPassage: string;
}
