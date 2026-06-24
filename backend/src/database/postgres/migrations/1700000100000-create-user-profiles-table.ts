import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the 1:1 `user_profiles` companion table that stores the onboarding
 * questionnaire answers (display name, style/pain/occasion arrays, body
 * measurements) and the profile completion timestamp.
 *
 * Uses `user_id` as the PK + FK so the profile is automatically destroyed when
 * the parent user row is hard-deleted (ON DELETE CASCADE). Array columns use a
 * `text[]` empty-array default so partial submissions are always valid.
 */
export class CreateUserProfilesTable1700000100000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE "user_profiles" (
        "user_id"           uuid         NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "display_name"      text,
        "shopping_pains"    text[]       NOT NULL DEFAULT '{}',
        "styles"            text[]       NOT NULL DEFAULT '{}',
        "occasions"         text[]       NOT NULL DEFAULT '{}',
        "gender"            text,
        "style_preferences" text[]       NOT NULL DEFAULT '{}',
        "country"           text,
        "height_cm"         integer,
        "weight_kg"         numeric(5,1),
        "bust_cm"           integer,
        "waist_cm"          integer,
        "hips_cm"           integer,
        "completed_at"      timestamptz,
        "created_at"        timestamptz  NOT NULL DEFAULT now(),
        "updated_at"        timestamptz  NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "user_profiles"`);
  }
}
