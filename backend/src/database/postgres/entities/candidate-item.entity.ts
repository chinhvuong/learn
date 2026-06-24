import { Column, Entity, Index } from 'typeorm';

import { ItemConfidence, ItemType } from '@modules/lessons/constants/lesson.constants';

import { AbstractEntity } from './abstract.entity';

/**
 * A Candidate Item — the **objective, shared** layer (CONTEXT.md → Candidate
 * Item; ADR-0001): every Item worth noting in a Source, extracted once and
 * cached/shared across all learners, each tagged with its own difficulty.
 *
 * This is distinct from {@link ItemEntity}, which is the Item as it belongs to a
 * specific Lesson. The Candidate Item set is what a per-learner projection
 * filters over (by Level and Item Status) — so A2 and C1 importing the same
 * Source share one Candidate Item set but get different personal views.
 *
 * Each Candidate Item is exactly one {@link ItemType} and is counted once
 * (the dedup rule, CONTEXT.md). Chunks carry a canonical lemmatized form
 * (ADR-0004); Grammar Points / anchored Chunks carry their Inventory id
 * (ADR-0003 / ADR-0004).
 */
@Entity('candidate_items')
@Index('idx_candidate_items_source', ['sourceId'])
// One Candidate Item per (Source, type, lemma) — enforces "counted once".
@Index('idx_candidate_items_dedup', ['sourceId', 'type', 'lemma'], { unique: true })
export class CandidateItemEntity extends AbstractEntity {
  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({ name: 'type', type: 'text' })
  type: ItemType;

  /**
   * The canonical lemmatized form (ADR-0004): the dedup/count key. For
   * Vocabulary it is the lemma; for a Chunk the canonical lemmatized form; for
   * a Grammar Point the Inventory entry's stable id.
   */
  @Column({ name: 'lemma', type: 'text' })
  lemma: string;

  /** The surface form as it first appeared in the Source. */
  @Column({ name: 'surface', type: 'text' })
  surface: string;

  /**
   * Stable Inventory id for anchored Items: the Grammar Inventory id
   * (ADR-0003) or the Chunk Inventory id (ADR-0004). Null for LLM-detected
   * candidate Chunks and for Vocabulary.
   */
  @Column({ name: 'inventory_id', type: 'text', nullable: true })
  inventoryId: string | null;

  @Column({ name: 'confidence', type: 'text', default: ItemConfidence.ANCHORED })
  confidence: ItemConfidence;

  /** Per-Item difficulty as a fine 0–100 Level score (CONTEXT.md → Level). */
  @Column({ name: 'level', type: 'integer', nullable: true })
  level: number | null;
}
