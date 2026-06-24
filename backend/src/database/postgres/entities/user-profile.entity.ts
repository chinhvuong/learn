import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 1:1 companion to `UserEntity`. Stores questionnaire answers from the style
 * onboarding flow (Wave 8). The row is created lazily on first PATCH /me/profile
 * submission — users who skip the questionnaire have no row here.
 *
 * `user_id` is the PK (not auto-generated) and a FK → users.id ON DELETE CASCADE,
 * so the profile is automatically purged when the parent user is hard-deleted (6A).
 */
@Entity('user_profiles')
export class UserProfileEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName: string | null;

  @Column({ name: 'shopping_pains', type: 'text', array: true, default: '{}' })
  shoppingPains: string[];

  @Column({ name: 'styles', type: 'text', array: true, default: '{}' })
  styles: string[];

  @Column({ name: 'occasions', type: 'text', array: true, default: '{}' })
  occasions: string[];

  @Column({ name: 'gender', type: 'text', nullable: true })
  gender: string | null;

  @Column({ name: 'style_preferences', type: 'text', array: true, default: '{}' })
  stylePreferences: string[];

  @Column({ name: 'country', type: 'text', nullable: true })
  country: string | null;

  @Column({ name: 'height_cm', type: 'integer', nullable: true })
  heightCm: number | null;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 1, nullable: true })
  weightKg: number | null;

  @Column({ name: 'bust_cm', type: 'integer', nullable: true })
  bustCm: number | null;

  @Column({ name: 'waist_cm', type: 'integer', nullable: true })
  waistCm: number | null;

  @Column({ name: 'hips_cm', type: 'integer', nullable: true })
  hipsCm: number | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
