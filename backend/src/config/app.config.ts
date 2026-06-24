import { validateConfig } from '@shared/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

enum EEnvironment {
  Local = 'local',
  Development = 'development',
  Production = 'production',
}

enum EServiceType {
  API = 'api',
  WORKER = 'worker',
  ALL = 'all',
}

class AppEnvVariables {
  @IsEnum(EEnvironment)
  @IsNotEmpty()
  @IsString()
  NODE_ENV: EEnvironment;

  @IsEnum(EServiceType)
  @IsNotEmpty()
  @IsString()
  SERVICE_TYPE: EServiceType;

  @IsNumber()
  @IsNotEmpty()
  TYPEORM_CACHE_TTL_MULTIPLIER: number;

  @IsBoolean()
  @IsNotEmpty()
  TYPEORM_CACHE_ENABLED: boolean;

  @IsBoolean()
  @IsOptional()
  HTTP_CACHE_ENABLED?: boolean;

  @IsBoolean()
  @IsOptional()
  BROWSER_CACHE_ENABLED?: boolean;

  @IsBoolean()
  @IsOptional()
  CDN_CACHE_ENABLED?: boolean;
}

const appConfig = registerAs('app', () => {
  validateConfig(process.env, AppEnvVariables);

  return {
    nodeEnv: process.env.NODE_ENV,
    serviceType: process.env.SERVICE_TYPE,
    api: {
      port: parseInt(process.env.API_PORT, 10),
      typeormCacheEnabled: process.env.TYPEORM_CACHE_ENABLED === 'true',
      typeormCacheTtlMultiplier: parseInt(process.env.TYPEORM_CACHE_TTL_MULTIPLIER, 10),
      httpCacheEnabled: process.env.HTTP_CACHE_ENABLED !== 'false',
      browserCacheEnabled: process.env.BROWSER_CACHE_ENABLED !== 'false',
      cdnCacheEnabled: process.env.CDN_CACHE_ENABLED !== 'false',
    },
    worker: {
      port: parseInt(process.env.WORKER_PORT, 10),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '4', 10),
    },
  };
});

export { EEnvironment, EServiceType, appConfig };
