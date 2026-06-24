import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

import type { FirebaseConfig } from '@config/firebase.config';

import { loadCredential, type LoadedCredential } from './firebase-credential-loader';

export const FIREBASE_ADMIN_AUTH = Symbol('FIREBASE_ADMIN_AUTH');

/**
 * Injects the raw Firebase Admin `App` instance.
 * Use this when you need a service beyond `Auth` (e.g. `Messaging` for FCM).
 */
export const FIREBASE_ADMIN_APP = Symbol('FIREBASE_ADMIN_APP');

const APP_NAME = 'inflow-firebase-admin';
const logger = new Logger('FirebaseAdminProvider');

function createApp(config: FirebaseConfig, result: LoadedCredential): App {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;

  return initializeApp(
    {
      credential: result.credential ? cert(result.credential) : applicationDefault(),
      projectId: config.projectId,
    },
    APP_NAME,
  );
}

/**
 * Nest provider that exposes `firebase-admin`'s `Auth` instance.
 *
 * The Admin SDK is process-global by design — `firebase-admin` reuses any app
 * with the same name across calls. Initialising here (rather than at module
 * import time) keeps the SDK from booting in the worker process unless this
 * provider is imported.
 */
export const firebaseAdminAuthProvider = {
  provide: FIREBASE_ADMIN_AUTH,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Auth => {
    const firebase = config.get<FirebaseConfig>('firebase');
    if (!firebase) {
      throw new Error('Firebase config missing — load firebaseConfig in ConfigModule.forRoot');
    }
    const result = loadCredential(firebase.serviceAccountJson);
    if (result.warning) {
      logger.warn(result.warning);
    }
    const app = createApp(firebase, result);
    logger.log(
      `Firebase Admin initialised for project ${firebase.projectId} using credential form ${result.form}`,
    );
    return getAuth(app);
  },
};

/**
 * Nest provider that exposes the raw Firebase Admin `App` instance.
 * Shares the same underlying SDK app as `firebaseAdminAuthProvider` — the SDK
 * is process-global and `createApp` guards against double-initialisation.
 */
export const firebaseAdminAppProvider = {
  provide: FIREBASE_ADMIN_APP,
  inject: [ConfigService],
  useFactory: (config: ConfigService): App => {
    const firebase = config.get<FirebaseConfig>('firebase');
    if (!firebase) {
      throw new Error('Firebase config missing — load firebaseConfig in ConfigModule.forRoot');
    }
    const result = loadCredential(firebase.serviceAccountJson);
    return createApp(firebase, result);
  },
};
