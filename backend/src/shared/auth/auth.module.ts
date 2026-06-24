import { Module } from '@nestjs/common';

import { firebaseAdminAppProvider, firebaseAdminAuthProvider } from './firebase-admin.provider';
import { FirebaseAuthMiddleware } from './firebase-auth.middleware';

/**
 * Owns the Firebase Admin SDK provider + the `FirebaseAuthMiddleware` that
 * verifies the `Authorization: Bearer <id token>` header on every API request
 * and upserts the matching `users` row by `firebase_uid`.
 *
 * Mounted globally from `AppApiModule.configure()`.
 */
@Module({
  providers: [firebaseAdminAuthProvider, firebaseAdminAppProvider, FirebaseAuthMiddleware],
  exports: [firebaseAdminAuthProvider, firebaseAdminAppProvider, FirebaseAuthMiddleware],
})
export class AuthModule {}
