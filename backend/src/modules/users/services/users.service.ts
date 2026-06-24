import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  UserEntity,
  UserProfileEntity,
  UserProfilesRepository,
  UsersRepository,
} from '@database/postgres';

import { ClaimAnonymousDto } from '../dto/claim-anonymous.dto';
import { PatchMeProfileDto } from '../dto/patch-me-profile.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UsersService {
  protected readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly userProfiles: UserProfilesRepository,
    @InjectDataSource('postgres') private readonly dataSource: DataSource,
  ) {}

  toDto(user: UserEntity, profile?: UserProfileEntity | null): UserDto {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid ?? '',
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      consentAge18At: user.consentAge18At ? user.consentAge18At.toISOString() : null,
      consentBodyPhotoAt: user.consentBodyPhotoAt ? user.consentBodyPhotoAt.toISOString() : null,
      displayName: profile?.displayName ?? null,
    };
  }

  async getMe(user: UserEntity): Promise<UserDto> {
    const profile = await this.userProfiles.findByUserId(user.id);
    return this.toDto(user, profile);
  }

  async setConsent(
    user: UserEntity,
    ageOver18: boolean,
    bodyPhotoStorage: boolean,
  ): Promise<UserDto> {
    const now = new Date();
    let dirty = false;

    if (ageOver18 && !user.consentAge18At) {
      user.consentAge18At = now;
      dirty = true;
    }
    if (bodyPhotoStorage && !user.consentBodyPhotoAt) {
      user.consentBodyPhotoAt = now;
      dirty = true;
    }

    if (dirty) {
      await this.users.save(user);
    }
    return this.toDto(user);
  }

  async setProfile(user: UserEntity, dto: PatchMeProfileDto): Promise<UserDto> {
    let profile = await this.userProfiles.findByUserId(user.id);

    if (!profile) {
      profile = new UserProfileEntity();
      profile.userId = user.id;
      profile.displayName = null;
      profile.shoppingPains = [];
      profile.styles = [];
      profile.occasions = [];
      profile.stylePreferences = [];
      profile.gender = null;
      profile.country = null;
      profile.heightCm = null;
      profile.weightKg = null;
      profile.bustCm = null;
      profile.waistCm = null;
      profile.hipsCm = null;
      profile.completedAt = null;
    }

    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.shoppingPains !== undefined) profile.shoppingPains = dto.shoppingPains;
    if (dto.styles !== undefined) profile.styles = dto.styles;
    if (dto.occasions !== undefined) profile.occasions = dto.occasions;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.stylePreferences !== undefined) profile.stylePreferences = dto.stylePreferences;
    if (dto.country !== undefined) profile.country = dto.country;
    if (dto.heightCm !== undefined) profile.heightCm = dto.heightCm;
    if (dto.weightKg !== undefined) profile.weightKg = dto.weightKg;
    if (dto.bustCm !== undefined) profile.bustCm = dto.bustCm;
    if (dto.waistCm !== undefined) profile.waistCm = dto.waistCm;
    if (dto.hipsCm !== undefined) profile.hipsCm = dto.hipsCm;

    const justCompleted = Boolean(dto.completed) && !profile.completedAt;
    if (justCompleted) profile.completedAt = new Date();

    profile = await this.userProfiles.save(profile);

    return this.toDto(user, profile);
  }

  /**
   * Migrate an anonymous session into the caller's real account. Merges the
   * anonymous user's profile fields into the real user's profile (real value
   * wins where set), then hard-deletes the anonymous user row. Idempotent — a
   * no-op when the anonymous user no longer exists.
   */
  async claimAnonymous(realUser: UserEntity, dto: ClaimAnonymousDto): Promise<UserDto> {
    const { anonymousUserId } = dto;

    const anonExists = await this.users.findOneById(anonymousUserId);
    if (!anonExists) {
      return this.getMe(realUser);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `
        INSERT INTO "user_profiles" ("user_id")
        VALUES ($1)
        ON CONFLICT ("user_id") DO NOTHING
        `,
        [realUser.id],
      );
      await manager.query(
        `
        UPDATE "user_profiles" r
        SET
          "display_name"      = COALESCE(r."display_name",      a."display_name"),
          "shopping_pains"    = CASE WHEN array_length(r."shopping_pains", 1) IS NULL
                                     THEN a."shopping_pains" ELSE r."shopping_pains" END,
          "styles"            = CASE WHEN array_length(r."styles", 1) IS NULL
                                     THEN a."styles" ELSE r."styles" END,
          "occasions"         = CASE WHEN array_length(r."occasions", 1) IS NULL
                                     THEN a."occasions" ELSE r."occasions" END,
          "style_preferences" = CASE WHEN array_length(r."style_preferences", 1) IS NULL
                                     THEN a."style_preferences" ELSE r."style_preferences" END,
          "gender"            = COALESCE(r."gender",      a."gender"),
          "country"           = COALESCE(r."country",     a."country"),
          "height_cm"         = COALESCE(r."height_cm",   a."height_cm"),
          "weight_kg"         = COALESCE(r."weight_kg",   a."weight_kg"),
          "bust_cm"           = COALESCE(r."bust_cm",     a."bust_cm"),
          "waist_cm"          = COALESCE(r."waist_cm",    a."waist_cm"),
          "hips_cm"           = COALESCE(r."hips_cm",     a."hips_cm"),
          "completed_at"      = COALESCE(r."completed_at", a."completed_at")
        FROM "user_profiles" a
        WHERE r."user_id" = $1 AND a."user_id" = $2
        `,
        [realUser.id, anonymousUserId],
      );
      await manager.query(`DELETE FROM "users" WHERE "id" = $1`, [anonymousUserId]);
    });

    return this.getMe(realUser);
  }
}
