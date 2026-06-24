import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';

import { UserEntity } from '@database/postgres/entities/user.entity';

export function currentUserFactory(_: unknown, ctx: ExecutionContext): UserEntity {
  const req = ctx.switchToHttp().getRequest<Request & { user?: UserEntity }>();
  if (!req.user) {
    throw new InternalServerErrorException(
      'CurrentUser unavailable — FirebaseAuthMiddleware did not run for this route',
    );
  }
  return req.user;
}

export const CurrentUser = createParamDecorator(currentUserFactory);
