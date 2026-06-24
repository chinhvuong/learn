import { createErrorFactory } from '@shared/errors/app-errors';

const firebaseAuthErrors = {
  AUTH_MISSING_TOKEN: {
    code: 'AUTH_MISSING_TOKEN',
    message: () => 'Missing or malformed Authorization header',
    statusCode: 401,
  },
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_INVALID_TOKEN',
    message: (reason: string) => `Firebase ID token rejected: ${reason}`,
    statusCode: 401,
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: () => 'Firebase ID token has expired',
    statusCode: 401,
  },
} as const;

export const firebaseAuthErrorFactory = createErrorFactory(firebaseAuthErrors);
