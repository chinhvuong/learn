import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';

import { validateConfig } from '@shared/utils/validate-config';

export interface FirebaseConfig {
  projectId: string;
  serviceAccountJson: string;
}

class FirebaseEnvVariables {
  @IsString()
  @IsNotEmpty()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @IsNotEmpty()
  FIREBASE_SERVICE_ACCOUNT_JSON: string;
}

export const firebaseConfig = registerAs<FirebaseConfig>('firebase', () => {
  validateConfig(process.env, FirebaseEnvVariables);

  return {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string,
  };
});
