/// <reference types="jest" />

import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { UserEntity, UsersRepository } from '@database/postgres';
import { UNIQUE_VIOLATION_CODE } from '@database/postgres/repositories/abstract.repository';
import { FirebaseAuthMiddleware } from '@shared/auth/firebase-auth.middleware';

const UID = 'TpO5Y8xMqOZLEKzj9b9F0cZQbDi2';
const EMAIL = 'jane@privaterelay.appleid.com';

function buildAuth(behavior: {
  verify?: (token: string) => Promise<DecodedIdToken> | DecodedIdToken;
}): Auth {
  return {
    verifyIdToken: jest.fn(async (token: string) => {
      return behavior.verify
        ? behavior.verify(token)
        : ({ uid: UID, email: EMAIL } as DecodedIdToken);
    }),
  } as unknown as Auth;
}

function buildRepo(behavior: {
  findOneByFirebaseUid?: jest.Mock;
  save?: jest.Mock;
  create?: jest.Mock;
}): UsersRepository {
  return {
    findOneByFirebaseUid: behavior.findOneByFirebaseUid ?? jest.fn().mockResolvedValue(null),
    save: behavior.save ?? jest.fn(async (entity) => entity),
    create:
      behavior.create ??
      jest.fn((partial: Partial<UserEntity>) => ({ ...partial, id: 'generated-uuid' })),
  } as unknown as UsersRepository;
}

function buildConfig(overrides?: {
  bullboardEnabled?: boolean;
  bullboardPath?: string;
}): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === 'bullboard.enabled') return overrides?.bullboardEnabled ?? false;
      if (key === 'bullboard.path') return overrides?.bullboardPath ?? '/admin/queues';
      return undefined;
    }),
  } as unknown as ConfigService;
}

function makeMiddleware(
  auth: Auth,
  repo: UsersRepository,
  config = buildConfig(),
): FirebaseAuthMiddleware {
  return new FirebaseAuthMiddleware(auth, repo, config);
}

function buildRequest(authHeader?: string): Request & { user?: UserEntity } {
  // `originalUrl` is consulted by the middleware's bypass guard
  // (`shouldBypassAuth`) — Express always populates it in production, so the
  // mock must too. We pick a path that does not match any bypass prefix so
  // the middleware exercises the auth path under test.
  return {
    originalUrl: '/api/v1/me',
    headers: authHeader ? { authorization: authHeader } : {},
  } as Request & { user?: UserEntity };
}

describe('FirebaseAuthMiddleware', () => {
  it('bypasses auth for the public healthcheck route (no token required)', async () => {
    const repo = buildRepo({});
    const middleware = makeMiddleware(buildAuth({}), repo);
    const req = {
      originalUrl: '/api/v1/health',
      headers: {},
    } as Request & { user?: UserEntity };
    const next = jest.fn() as unknown as NextFunction;

    await middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  it('inserts a new user when the firebase_uid is unseen', async () => {
    const create = jest.fn((partial: Partial<UserEntity>) => ({ ...partial, id: 'new' }));
    const save = jest.fn(async (entity) => entity as UserEntity);
    const findOneByFirebaseUid = jest.fn().mockResolvedValue(null);
    const repo = buildRepo({ create, save, findOneByFirebaseUid });

    const middleware = makeMiddleware(buildAuth({}), repo);
    const req = buildRequest('Bearer fake-id-token');
    const next = jest.fn() as unknown as NextFunction;

    await middleware.use(req, {} as Response, next);

    expect(findOneByFirebaseUid).toHaveBeenCalledWith(UID);
    expect(create).toHaveBeenCalledWith({ firebaseUid: UID, email: EMAIL });
    expect(save).toHaveBeenCalledTimes(1);
    expect(req.user?.firebaseUid).toBe(UID);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns the existing user without re-inserting on repeat sign-in', async () => {
    const existing = { id: 'existing', firebaseUid: UID, email: EMAIL } as UserEntity;
    const findOneByFirebaseUid = jest.fn().mockResolvedValue(existing);
    const save = jest.fn();
    const repo = buildRepo({ findOneByFirebaseUid, save });

    const middleware = makeMiddleware(buildAuth({}), repo);
    const req = buildRequest('Bearer fake-id-token');
    const next = jest.fn() as unknown as NextFunction;

    await middleware.use(req, {} as Response, next);

    expect(save).not.toHaveBeenCalled();
    expect(req.user).toBe(existing);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('updates email when the verified token brings a newer value', async () => {
    const existing = { id: 'existing', firebaseUid: UID, email: 'old@example.com' } as UserEntity;
    const findOneByFirebaseUid = jest.fn().mockResolvedValue(existing);
    const save = jest.fn(async (e) => e);
    const repo = buildRepo({ findOneByFirebaseUid, save });

    const middleware = makeMiddleware(buildAuth({}), repo);
    const req = buildRequest('Bearer fake-id-token');
    const next = jest.fn() as unknown as NextFunction;

    await middleware.use(req, {} as Response, next);

    expect(save).toHaveBeenCalledTimes(1);
    expect(existing.email).toBe(EMAIL);
    expect(req.user?.email).toBe(EMAIL);
  });

  it('recovers when two concurrent requests race to insert the same uid', async () => {
    const winner = { id: 'winner', firebaseUid: UID, email: EMAIL } as UserEntity;
    const findOneByFirebaseUid = jest
      .fn()
      .mockResolvedValueOnce(null) // initial lookup
      .mockResolvedValueOnce(winner); // re-read after losing the race
    const dupError = Object.assign(new Error('duplicate'), { code: UNIQUE_VIOLATION_CODE });
    const save = jest.fn().mockRejectedValueOnce(dupError);
    const repo = buildRepo({ findOneByFirebaseUid, save });

    const middleware = makeMiddleware(buildAuth({}), repo);
    const req = buildRequest('Bearer fake-id-token');
    const next = jest.fn() as unknown as NextFunction;

    await middleware.use(req, {} as Response, next);

    expect(req.user).toBe(winner);
    expect(findOneByFirebaseUid).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects requests without an Authorization header', async () => {
    const middleware = makeMiddleware(buildAuth({}), buildRepo({}));
    const next = jest.fn() as unknown as NextFunction;

    await expect(middleware.use(buildRequest(), {} as Response, next)).rejects.toMatchObject({
      errorCode: 'AUTH_MISSING_TOKEN',
      statusCode: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects malformed Authorization headers', async () => {
    const middleware = makeMiddleware(buildAuth({}), buildRepo({}));
    const next = jest.fn() as unknown as NextFunction;

    await expect(
      middleware.use(buildRequest('Token abc'), {} as Response, next),
    ).rejects.toMatchObject({ errorCode: 'AUTH_MISSING_TOKEN' });
  });

  it('translates expired-token FirebaseAuthError to AUTH_TOKEN_EXPIRED', async () => {
    const expired = Object.assign(new Error('Token expired'), { code: 'auth/id-token-expired' });
    const middleware = makeMiddleware(
      buildAuth({
        verify: () => {
          throw expired;
        },
      }),
      buildRepo({}),
    );
    const next = jest.fn() as unknown as NextFunction;

    await expect(
      middleware.use(buildRequest('Bearer expired'), {} as Response, next),
    ).rejects.toMatchObject({ errorCode: 'AUTH_TOKEN_EXPIRED', statusCode: 401 });
  });

  it('translates other FirebaseAuthErrors to AUTH_INVALID_TOKEN', async () => {
    const invalid = Object.assign(new Error('Malformed token'), { code: 'auth/argument-error' });
    const middleware = makeMiddleware(
      buildAuth({
        verify: () => {
          throw invalid;
        },
      }),
      buildRepo({}),
    );
    const next = jest.fn() as unknown as NextFunction;

    await expect(
      middleware.use(buildRequest('Bearer bad'), {} as Response, next),
    ).rejects.toMatchObject({ errorCode: 'AUTH_INVALID_TOKEN', statusCode: 401 });
  });
});
