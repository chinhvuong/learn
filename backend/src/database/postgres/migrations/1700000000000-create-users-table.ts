import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `users` table — the application user keyed to a Firebase identity.
 * Rows are created lazily by FirebaseAuthMiddleware on the first authenticated
 * request for a given `firebase_uid`. The partial unique index enforces one row
 * per Firebase uid while allowing multiple NULL uids.
 */
export class CreateUsersTable1700000000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE "users" (
        "id"                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        "firebase_uid"          text,
        "email"                 text,
        "consent_age_18_at"     timestamptz,
        "consent_body_photo_at" timestamptz,
        "created_at"            timestamptz NOT NULL DEFAULT now(),
        "updated_at"            timestamptz NOT NULL DEFAULT now(),
        "deleted_at"            timestamptz,
        "version"               integer     NOT NULL DEFAULT 1
      )
    `);

    await qr.query(`
      CREATE UNIQUE INDEX "idx_users_firebase_uid"
        ON "users" ("firebase_uid")
        WHERE "firebase_uid" IS NOT NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS "idx_users_firebase_uid"`);
    await qr.query(`DROP TABLE IF EXISTS "users"`);
  }
}
