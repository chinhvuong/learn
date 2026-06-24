import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the Lesson Creation Engine tables (issue #3): `sources`,
 * `candidate_items`, `lessons`, `items`.
 *
 * - `sources` holds the hybrid Source identity (ADR-0001): `content_hash` is the
 *   authoritative unique key, `normalized_url` is the fast-path unique key
 *   (partial — only when present). `pool_eligible` gates promotion into the
 *   shared recommendation pool; private text/file Sources stay false.
 * - `candidate_items` is the shared objective derived layer (ADR-0001), unique
 *   per (source, type, lemma) so each Item is counted once.
 * - `lessons` carries the importer-private full text + Bilingual Passage, one
 *   row per ~3–5-min segment of a Source.
 * - `items` is the Lesson-scoped projection of Candidate Items, unique per
 *   (lesson, type, lemma).
 *
 * All children FK → their parent ON DELETE CASCADE so deleting a Source purges
 * its whole derived + private layer.
 */
export class CreateLessonEngineTables1700000200000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE "sources" (
        "id"               uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "type"             text         NOT NULL,
        "title"            text,
        "normalized_url"   text,
        "content_hash"     text         NOT NULL,
        "language"         text         NOT NULL DEFAULT 'en',
        "duration_seconds" integer      NOT NULL,
        "topic"            text,
        "author"           text,
        "pool_eligible"    boolean      NOT NULL DEFAULT false,
        "created_at"       timestamptz  NOT NULL DEFAULT now(),
        "updated_at"       timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"       timestamptz,
        "version"          integer      NOT NULL DEFAULT 1
      )
    `);
    await qr.query(`CREATE UNIQUE INDEX "idx_sources_content_hash" ON "sources" ("content_hash")`);
    await qr.query(
      `CREATE UNIQUE INDEX "idx_sources_normalized_url" ON "sources" ("normalized_url") WHERE "normalized_url" IS NOT NULL`,
    );

    await qr.query(`
      CREATE TABLE "candidate_items" (
        "id"           uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "source_id"    uuid         NOT NULL REFERENCES "sources"("id") ON DELETE CASCADE,
        "type"         text         NOT NULL,
        "lemma"        text         NOT NULL,
        "surface"      text         NOT NULL,
        "inventory_id" text,
        "confidence"   text         NOT NULL DEFAULT 'anchored',
        "level"        integer,
        "created_at"   timestamptz  NOT NULL DEFAULT now(),
        "updated_at"   timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"   timestamptz,
        "version"      integer      NOT NULL DEFAULT 1
      )
    `);
    await qr.query(`CREATE INDEX "idx_candidate_items_source" ON "candidate_items" ("source_id")`);
    await qr.query(
      `CREATE UNIQUE INDEX "idx_candidate_items_dedup" ON "candidate_items" ("source_id", "type", "lemma")`,
    );

    await qr.query(`
      CREATE TABLE "lessons" (
        "id"                uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "source_id"         uuid         NOT NULL REFERENCES "sources"("id") ON DELETE CASCADE,
        "title"             text,
        "segment_index"     integer      NOT NULL DEFAULT 0,
        "duration_seconds"  integer      NOT NULL,
        "original_text"     text         NOT NULL,
        "bilingual_passage" text         NOT NULL,
        "created_at"        timestamptz  NOT NULL DEFAULT now(),
        "updated_at"        timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"        timestamptz,
        "version"           integer      NOT NULL DEFAULT 1
      )
    `);
    await qr.query(`CREATE INDEX "idx_lessons_source" ON "lessons" ("source_id")`);
    await qr.query(
      `CREATE UNIQUE INDEX "idx_lessons_source_segment" ON "lessons" ("source_id", "segment_index")`,
    );

    await qr.query(`
      CREATE TABLE "items" (
        "id"                uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        "lesson_id"         uuid         NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "candidate_item_id" uuid         NOT NULL REFERENCES "candidate_items"("id") ON DELETE CASCADE,
        "type"              text         NOT NULL,
        "lemma"             text         NOT NULL,
        "surface"           text         NOT NULL,
        "inventory_id"      text,
        "confidence"        text         NOT NULL DEFAULT 'anchored',
        "level"             integer,
        "created_at"        timestamptz  NOT NULL DEFAULT now(),
        "updated_at"        timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"        timestamptz,
        "version"           integer      NOT NULL DEFAULT 1
      )
    `);
    await qr.query(`CREATE INDEX "idx_items_lesson" ON "items" ("lesson_id")`);
    await qr.query(`CREATE INDEX "idx_items_candidate" ON "items" ("candidate_item_id")`);
    await qr.query(
      `CREATE UNIQUE INDEX "idx_items_dedup" ON "items" ("lesson_id", "type", "lemma")`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "items"`);
    await qr.query(`DROP TABLE IF EXISTS "lessons"`);
    await qr.query(`DROP TABLE IF EXISTS "candidate_items"`);
    await qr.query(`DROP TABLE IF EXISTS "sources"`);
  }
}
