import { validateConfig } from '@shared/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

class StorageEnvVariables {
  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  @IsNotEmpty()
  R2_ENDPOINT_URL: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  @IsNotEmpty()
  R2_PUBLIC_URL_BASE: string;
}

const storageConfig = registerAs('storage', () => {
  validateConfig(process.env, StorageEnvVariables);

  return {
    r2: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      accountId: process.env.R2_ACCOUNT_ID,
      bucketName: process.env.R2_BUCKET_NAME,
      endpointUrl: process.env.R2_ENDPOINT_URL,
      publicUrlBase: process.env.R2_PUBLIC_URL_BASE.replace(/\/+$/, ''),
    },
    requestTimeoutMs: 30_000,
  };
});

export { storageConfig };
