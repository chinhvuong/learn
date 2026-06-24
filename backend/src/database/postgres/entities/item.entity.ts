import { Column, Entity, Index } from 'typeorm';

import { ItemConfidence, ItemType } from '@modules/lessons/constants/lesson.constants';

import { AbstractEntity } from './abstract.entity';

/**
 * An Item — a single learnable thing belonging to a Lesson (CONTEXT.md → Item).
 * Exactly one of three types: Vocabulary, Chunk, or Grammar Point. Items are
 * what the stats count and what SRS reviews.
 *
 * An Item is the Lesson-scoped projection of a {@link CandidateItemEntity}
 * (`candidateItemId` links back to the shared objective set). Within a Lesson
 * each Item is counted once — the dedup rule (CONTEXT.md): fixed expression →
 * Chunk, template with a slot → Grammar Point, single word → Vocabulary.
 */
@Entity('items')
@Index('idx_items_lesson', ['lessonId'])
@Index('idx_items_candidate', ['candidateItemId'])
// One Item per (Lesson, type, lemma) — enforces "counted once each".
@Index('idx_items_dedup', ['lessonId', 'type', 'lemma'], { unique: true })
export class ItemEntity extends AbstractEntity {
  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  /** Back-reference to the shared Candidate Item this Item projects. */
  @Column({ name: 'candidate_item_id', type: 'uuid' })
  candidateItemId: string;

  @Column({ name: 'type', type: 'text' })
  type: ItemType;

  /** Canonical lemmatized form — the dedup/count key (ADR-0004). */
  @Column({ name: 'lemma', type: 'text' })
  lemma: string;

  @Column({ name: 'surface', type: 'text' })
  surface: string;

  /** Stable Grammar/Chunk Inventory id for anchored Items (ADR-0003/0004). */
  @Column({ name: 'inventory_id', type: 'text', nullable: true })
  inventoryId: string | null;

  @Column({ name: 'confidence', type: 'text', default: ItemConfidence.ANCHORED })
  confidence: ItemConfidence;

  @Column({ name: 'level', type: 'integer', nullable: true })
  level: number | null;
}
