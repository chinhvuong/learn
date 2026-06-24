import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

import { UserEntity, UsersRepository } from '@database/postgres';
import { UNIQUE_VIOLATION_CODE } from '@database/postgres/repositories/abstract.repository';

import { FIREBASE_ADMIN_AUTH } from './firebase-admin.provider';
import { firebaseAuthErrorFactory } from './firebase-auth.errors';

/**
 * Verifies the `Authorization: Bearer <ID token>` header against the Firebase
 * Admin SDK on every request, then upserts the matching `users` row keyed by
 * `firebase_uid`. Downstream `@CurrentUser()` consumers read the attached
 * entity exactly the same way they did under the tracer-bullet seed user.
 *
 * **Race safety:** the lookup-then-insert pattern relies on the partial
 * unique index on `firebase_uid` (see UserEntity). If two requests for a brand
 * new uid land at once, one INSERT wins and the other catches `23505` and
 * re-reads the row.
 */
@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FirebaseAuthMiddleware.name);

  constructor(
    @Inject(FIREBASE_ADMIN_AUTH) private readonly auth: Auth,
    private readonly users: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // Healthcheck + Bull Board carry no user context — let them through.
    // We match against `originalUrl` because NestJS's
    // `MiddlewareConsumer.forRoutes('*')` mounts this middleware in a way that
    // makes `req.url` appear as `/` here, defeating the equivalent `exclude(…)`
    // route patterns we tried first.
    const bullboardEnabled = this.config.get<boolean>('bullboard.enabled') ?? false;
    const bullboardPath = this.config.get<string>('bullboard.path') ?? '/admin/queues';
    if (shouldBypassAuth(req.originalUrl ?? req.url, bullboardEnabled, bullboardPath)) {
      next();
      return;
    }

    const token = extractBearerToken(req);
    if (!token) throw firebaseAuthErrorFactory.AUTH_MISSING_TOKEN();

    const decoded = await this.verify(token);
    const user = await this.resolveUser(decoded);

    (req as Request & { user?: UserEntity }).user = user;
    next();
  }

  private async verify(token: string): Promise<DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(token, true);
    } catch (error) {
      // FirebaseAuthError surfaces as `{ code: 'auth/<reason>', message }`.
      // Match by code string rather than `instanceof` so the check survives
      // duplicate `firebase-admin` copies in node_modules (jest hoist, monorepo, …).
      const code = (error as { code?: string }).code;
      if (typeof code === 'string' && code.startsWith('auth/')) {
        if (code === 'auth/id-token-expired') {
          throw firebaseAuthErrorFactory.AUTH_TOKEN_EXPIRED();
        }
        throw firebaseAuthErrorFactory.AUTH_INVALID_TOKEN(code);
      }
      throw firebaseAuthErrorFactory.AUTH_INVALID_TOKEN((error as Error).message ?? 'unknown');
    }
  }

  private async resolveUser(token: DecodedIdToken): Promise<UserEntity> {
    const existing = await this.users.findOneByFirebaseUid(token.uid);
    if (existing) {
      const nextEmail = token.email ?? null;
      if (nextEmail && existing.email !== nextEmail) {
        existing.email = nextEmail;
        await this.users.save(existing);
      }
      return existing;
    }

    try {
      const created = await this.users.save(
        this.users.create({
          firebaseUid: token.uid,
          email: token.email ?? null,
        }),
      );
      return created;
    } catch (error: unknown) {
      // Lost the insert race — another request inserted the same uid first.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION_CODE) {
        const winner = await this.users.findOneByFirebaseUid(token.uid);
        if (winner) return winner;
      }
      this.logger.error(`User upsert failed for uid=${token.uid}`, error as Error);
      throw error;
    }
  }
}

// The healthcheck carries no user context — it must be reachable with no bearer
// token. We match on `originalUrl` (not `req.url`) because `forRoutes('*')`
// rewrites `req.url` to `/`, defeating the equivalent `exclude(…)` patterns.
const STATIC_BYPASS_PREFIXES = ['/api/v1/health'];

function shouldBypassAuth(path: string, bullboardEnabled: boolean, bullboardPath: string): boolean {
  const [bare] = path.split('?');
  if (STATIC_BYPASS_PREFIXES.some((prefix) => bare === prefix || bare.startsWith(prefix))) {
    return true;
  }
  // Bull Board bypass — only when enabled, and matched on a segment boundary
  // to prevent path-confusion (e.g. `/api/admin/queues-extra` must not bypass).
  if (bullboardEnabled) {
    const boardPrefix = `/api${bullboardPath}`;
    if (bare === boardPrefix || bare.startsWith(boardPrefix + '/')) {
      return true;
    }
  }
  return false;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim() || null;
}
