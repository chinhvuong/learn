/// <reference types="jest" />

import {
  UserEntity,
  UserProfileEntity,
  UserProfilesRepository,
  UsersRepository,
} from '@database/postgres';
import { UsersService } from '@modules/users/services/users.service';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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

function buildProfile(overrides: Partial<UserProfileEntity> = {}): UserProfileEntity {
  return {
    userId: 'user-1',
    displayName: null,
    shoppingPains: [],
    styles: [],
    occasions: [],
    stylePreferences: [],
    gender: null,
    country: null,
    heightCm: null,
    weightKg: null,
    bustCm: null,
    waistCm: null,
    hipsCm: null,
    completedAt: null,
    createdAt: new Date('2026-06-04T10:00:00.000Z'),
    updatedAt: new Date('2026-06-04T10:00:00.000Z'),
    ...overrides,
  } as UserProfileEntity;
}

function buildRepo(save?: jest.Mock): UsersRepository {
  return {
    save: save ?? jest.fn(async (entity) => entity),
    findOneById: jest.fn(async () => null),
  } as unknown as UsersRepository;
}

function buildDataSource(): import('typeorm').DataSource {
  return {
    transaction: jest.fn(async (cb: (m: unknown) => unknown) =>
      cb({ query: jest.fn(async () => []) }),
    ),
  } as unknown as import('typeorm').DataSource;
}

function makeService(users: UsersRepository, profiles: UserProfilesRepository): UsersService {
  return new UsersService(users, profiles, buildDataSource());
}

function buildProfileRepo(overrides?: {
  findByUserId?: jest.Mock;
  save?: jest.Mock;
}): UserProfilesRepository {
  return {
    findByUserId: overrides?.findByUserId ?? jest.fn(async () => null),
    save: overrides?.save ?? jest.fn(async (entity) => entity),
  } as unknown as UserProfilesRepository;
}

describe('UsersService.toDto', () => {
  it('serializes the user with consent timestamps null and displayName null when no profile', () => {
    const service = makeService(buildRepo(), buildProfileRepo());
    const dto = service.toDto(buildUser());

    expect(dto).toEqual({
      id: 'user-1',
      firebaseUid: 'firebase-uid-1',
      email: 'user@example.com',
      createdAt: '2026-05-25T10:30:00.000Z',
      consentAge18At: null,
      consentBodyPhotoAt: null,
      displayName: null,
    });
  });

  it('serializes consent timestamps as ISO strings when set', () => {
    const service = makeService(buildRepo(), buildProfileRepo());
    const dto = service.toDto(
      buildUser({
        consentAge18At: new Date('2026-05-28T15:42:11.000Z'),
        consentBodyPhotoAt: new Date('2026-05-28T15:42:11.000Z'),
      }),
    );

    expect(dto.consentAge18At).toBe('2026-05-28T15:42:11.000Z');
    expect(dto.consentBodyPhotoAt).toBe('2026-05-28T15:42:11.000Z');
  });

  it('coerces null firebaseUid to empty string for the wire shape', () => {
    const service = makeService(buildRepo(), buildProfileRepo());
    const dto = service.toDto(buildUser({ firebaseUid: null }));

    expect(dto.firebaseUid).toBe('');
  });

  it('surfaces displayName from the profile when provided', () => {
    const service = makeService(buildRepo(), buildProfileRepo());
    const dto = service.toDto(buildUser(), buildProfile({ displayName: 'Jane D.' }));
    expect(dto.displayName).toBe('Jane D.');
  });
});

describe('UsersService.getMe', () => {
  it('loads the profile and includes displayName in the DTO', async () => {
    const profile = buildProfile({ displayName: 'Jane' });
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => profile) }),
    );
    const dto = await service.getMe(buildUser());
    expect(dto.displayName).toBe('Jane');
  });

  it('returns displayName null when no profile row exists', async () => {
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => null) }),
    );
    const dto = await service.getMe(buildUser());
    expect(dto.displayName).toBeNull();
  });
});

describe('UsersService.setConsent', () => {
  it('stamps both timestamps on first true/true submission', async () => {
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser();

    const dto = await service.setConsent(user, true, true);

    expect(save).toHaveBeenCalledTimes(1);
    expect(user.consentAge18At).toBeInstanceOf(Date);
    expect(user.consentBodyPhotoAt).toBeInstanceOf(Date);
    expect(dto.consentAge18At).toMatch(ISO_RE);
    expect(dto.consentBodyPhotoAt).toMatch(ISO_RE);
  });

  it('keeps existing timestamps on idempotent re-submission', async () => {
    const initial = new Date('2026-05-28T10:00:00.000Z');
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser({ consentAge18At: initial, consentBodyPhotoAt: initial });

    const dto = await service.setConsent(user, true, true);

    expect(save).not.toHaveBeenCalled();
    expect(user.consentAge18At).toBe(initial);
    expect(user.consentBodyPhotoAt).toBe(initial);
    expect(dto.consentAge18At).toBe(initial.toISOString());
    expect(dto.consentBodyPhotoAt).toBe(initial.toISOString());
  });

  it('flips only the matching column on partial submission', async () => {
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser();

    const dto = await service.setConsent(user, true, false);

    expect(save).toHaveBeenCalledTimes(1);
    expect(user.consentAge18At).toBeInstanceOf(Date);
    expect(user.consentBodyPhotoAt).toBeNull();
    expect(dto.consentAge18At).toMatch(ISO_RE);
    expect(dto.consentBodyPhotoAt).toBeNull();
  });

  it('treats false as a no-op even when the column is still null', async () => {
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser();

    const dto = await service.setConsent(user, false, false);

    expect(save).not.toHaveBeenCalled();
    expect(user.consentAge18At).toBeNull();
    expect(user.consentBodyPhotoAt).toBeNull();
    expect(dto.consentAge18At).toBeNull();
    expect(dto.consentBodyPhotoAt).toBeNull();
  });

  it('does not reset a stamped column when input is false', async () => {
    const initial = new Date('2026-05-28T10:00:00.000Z');
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser({ consentAge18At: initial, consentBodyPhotoAt: initial });

    await service.setConsent(user, false, false);

    expect(save).not.toHaveBeenCalled();
    expect(user.consentAge18At).toBe(initial);
    expect(user.consentBodyPhotoAt).toBe(initial);
  });

  it('only sets the column that was previously null when mixing states', async () => {
    const ageInitial = new Date('2026-05-28T10:00:00.000Z');
    const save = jest.fn(async (entity) => entity);
    const service = makeService(buildRepo(save), buildProfileRepo());
    const user = buildUser({ consentAge18At: ageInitial, consentBodyPhotoAt: null });

    await service.setConsent(user, true, true);

    expect(save).toHaveBeenCalledTimes(1);
    expect(user.consentAge18At).toBe(ageInitial);
    expect(user.consentBodyPhotoAt).toBeInstanceOf(Date);
  });
});

describe('UsersService.setProfile', () => {
  it('creates a new profile row on first submission', async () => {
    const profileSave = jest.fn(async (entity) => entity);
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => null), save: profileSave }),
    );
    const user = buildUser();

    const dto = await service.setProfile(user, { displayName: 'Jane', shoppingPains: ['fit'] });

    expect(profileSave).toHaveBeenCalledTimes(1);
    const saved = profileSave.mock.calls[0][0] as UserProfileEntity;
    expect(saved.userId).toBe('user-1');
    expect(saved.displayName).toBe('Jane');
    expect(saved.shoppingPains).toEqual(['fit']);
    expect(dto.displayName).toBe('Jane');
  });

  it('updates only the provided fields on re-submission', async () => {
    const existing = buildProfile({
      displayName: 'Jane',
      shoppingPains: ['fit'],
      styles: ['minimal'],
    });
    const profileSave = jest.fn(async (entity) => entity);
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => existing), save: profileSave }),
    );
    const user = buildUser();

    await service.setProfile(user, { styles: ['streetwear'] });

    const saved = profileSave.mock.calls[0][0] as UserProfileEntity;
    expect(saved.displayName).toBe('Jane');
    expect(saved.shoppingPains).toEqual(['fit']);
    expect(saved.styles).toEqual(['streetwear']);
  });

  it('stamps completedAt only once', async () => {
    const profileSave = jest.fn(async (entity) => entity);

    const freshProfile = buildProfile({ completedAt: null });
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => freshProfile), save: profileSave }),
    );
    const user = buildUser();

    await service.setProfile(user, { completed: true });
    const firstSaved = profileSave.mock.calls[0][0] as UserProfileEntity;
    expect(firstSaved.completedAt).toBeInstanceOf(Date);
    const stamp = firstSaved.completedAt as Date;

    // Simulate idempotent re-submit: the loaded profile already has completedAt.
    const alreadyDone = buildProfile({ completedAt: stamp });
    const service2 = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => alreadyDone), save: profileSave }),
    );
    await service2.setProfile(user, { completed: true });
    const secondSaved = profileSave.mock.calls[1][0] as UserProfileEntity;
    expect(secondSaved.completedAt).toBe(stamp);
  });

  it('initialises arrays to empty when creating a new profile and none provided', async () => {
    const profileSave = jest.fn(async (entity) => entity);
    const service = makeService(
      buildRepo(),
      buildProfileRepo({ findByUserId: jest.fn(async () => null), save: profileSave }),
    );
    await service.setProfile(buildUser(), {});
    const saved = profileSave.mock.calls[0][0] as UserProfileEntity;
    expect(saved.shoppingPains).toEqual([]);
    expect(saved.styles).toEqual([]);
    expect(saved.occasions).toEqual([]);
  });
});

describe('UsersService.claimAnonymous', () => {
  it('no-ops and returns the real user when the anonymous user does not exist', async () => {
    const findByUserId = jest.fn(async () => null);
    const usersRepo = {
      save: jest.fn(async (e) => e),
      findOneById: jest.fn(async () => null), // anon does not exist
    } as unknown as UsersRepository;
    const service = makeService(usersRepo, buildProfileRepo({ findByUserId }));

    const dto = await service.claimAnonymous(buildUser(), {
      anonymousUserId: '4b3a2c1d-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    });

    expect(dto.id).toBe('user-1');
  });

  it('runs the merge transaction and deletes the anonymous user when it exists', async () => {
    const query = jest.fn(async () => []);
    const dataSource = {
      transaction: jest.fn(async (cb: (m: unknown) => unknown) => cb({ query })),
    } as unknown as import('typeorm').DataSource;
    const usersRepo = {
      save: jest.fn(async (e) => e),
      findOneById: jest.fn(async () => buildUser({ id: 'anon-1' })),
    } as unknown as UsersRepository;
    const profilesRepo = buildProfileRepo({ findByUserId: jest.fn(async () => null) });

    const service = new UsersService(usersRepo, profilesRepo, dataSource);
    await service.claimAnonymous(buildUser(), {
      anonymousUserId: '4b3a2c1d-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    });

    // upsert profile + merge update + delete anon user = 3 queries
    expect(query).toHaveBeenCalledTimes(3);
    const calls = query.mock.calls as unknown as string[][];
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toMatch(/DELETE FROM "users"/);
  });
});
