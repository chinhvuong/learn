/// <reference types="jest" />

import { UserEntity, UserProfilesRepository, UsersRepository } from '@database/postgres';
import { UsersController } from '@modules/users/controllers/users.controller';
import { UsersService } from '@modules/users/services/users.service';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    firebaseUid: 'firebase-uid-1',
    email: 'user@example.com',
    createdAt: new Date('2026-05-25T10:30:00.000Z'),
    updatedAt: new Date('2026-05-25T10:30:00.000Z'),
    deletedAt: null,
    version: 1,
    consentAge18At: null,
    consentBodyPhotoAt: null,
    ...overrides,
  } as UserEntity;
}

function buildController(save?: jest.Mock): {
  controller: UsersController;
  service: UsersService;
  save: jest.Mock;
} {
  const saveFn = save ?? jest.fn(async (entity) => entity);
  const repo = {
    save: saveFn,
    findOneById: jest.fn(async () => null),
  } as unknown as UsersRepository;
  const profileRepo = {
    findByUserId: jest.fn(async () => null),
    save: jest.fn(async (entity) => entity),
  } as unknown as UserProfilesRepository;
  const dataSource = {
    transaction: jest.fn(async (cb: (m: unknown) => unknown) =>
      cb({ query: jest.fn(async () => []) }),
    ),
  } as unknown as import('typeorm').DataSource;
  const service = new UsersService(repo, profileRepo, dataSource);
  return { controller: new UsersController(service), service, save: saveFn };
}

describe('UsersController', () => {
  describe('getMe', () => {
    it('returns the current user serialized via UsersService.toDto', async () => {
      const { controller } = buildController();
      const user = buildUser({
        consentAge18At: new Date('2026-05-28T15:42:11.000Z'),
      });

      const dto = await controller.getMe(user);

      expect(dto.id).toBe('user-1');
      expect(dto.consentAge18At).toBe('2026-05-28T15:42:11.000Z');
      expect(dto.consentBodyPhotoAt).toBeNull();
    });
  });

  describe('patchConsent', () => {
    it('stamps timestamps on first submission and returns updated DTO', async () => {
      const { controller, save } = buildController();
      const user = buildUser();

      const dto = await controller.patchConsent(user, { ageOver18: true, bodyPhotoStorage: true });

      expect(save).toHaveBeenCalledTimes(1);
      expect(dto.consentAge18At).not.toBeNull();
      expect(dto.consentBodyPhotoAt).not.toBeNull();
    });

    it('is idempotent on re-submission', async () => {
      const initial = new Date('2026-05-28T10:00:00.000Z');
      const { controller, save } = buildController();
      const user = buildUser({ consentAge18At: initial, consentBodyPhotoAt: initial });

      const dto = await controller.patchConsent(user, { ageOver18: true, bodyPhotoStorage: true });

      expect(save).not.toHaveBeenCalled();
      expect(dto.consentAge18At).toBe(initial.toISOString());
      expect(dto.consentBodyPhotoAt).toBe(initial.toISOString());
    });

    it('only flips the matching column on partial submission', async () => {
      const { controller, save } = buildController();
      const user = buildUser();

      const dto = await controller.patchConsent(user, { ageOver18: true, bodyPhotoStorage: false });

      expect(save).toHaveBeenCalledTimes(1);
      expect(dto.consentAge18At).not.toBeNull();
      expect(dto.consentBodyPhotoAt).toBeNull();
    });
  });
});
