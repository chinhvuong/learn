/// <reference types="jest" />

import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';

import { UserEntity } from '@database/postgres/entities/user.entity';
import { currentUserFactory } from '@shared/auth/current-user.decorator';

function buildContext(user: UserEntity | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('currentUserFactory', () => {
  it('returns the user attached to the request', () => {
    const user = { id: 'u1' } as UserEntity;
    const ctx = buildContext(user);

    expect(currentUserFactory(undefined, ctx)).toBe(user);
  });

  it('throws when request.user is missing (middleware misconfig)', () => {
    const ctx = buildContext(undefined);

    expect(() => currentUserFactory(undefined, ctx)).toThrow(InternalServerErrorException);
  });
});
