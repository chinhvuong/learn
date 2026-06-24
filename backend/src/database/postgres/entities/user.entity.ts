import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from './abstract.entity';

/**
 * Application user, keyed to a Firebase identity. Created lazily by
 * `FirebaseAuthMiddleware` on the first authenticated request for a given
 * `firebase_uid`. Consent timestamps are stamped once (never reset) when the
 * user submits the consent screen.
 */
@Entity('users')
@Index('idx_users_firebase_uid', ['firebaseUid'], {
  unique: true,
  where: 'firebase_uid IS NOT NULL',
})
export class UserEntity extends AbstractEntity {
  @Column({ name: 'firebase_uid', type: 'text', nullable: true })
  firebaseUid: string | null;

  @Column({ name: 'email', type: 'text', nullable: true })
  email: string | null;

  @Column({ name: 'consent_age_18_at', type: 'timestamptz', nullable: true })
  consentAge18At: Date | null;

  @Column({ name: 'consent_body_photo_at', type: 'timestamptz', nullable: true })
  consentBodyPhotoAt: Date | null;
}
