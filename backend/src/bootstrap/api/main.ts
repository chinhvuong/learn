import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { json } from 'express';
import { AppApiModule } from './app.module';
import { HttpExceptionFilter } from '@shared/filters/http-exception.filter';
import { AppErrorFilter } from '@shared/filters/app-error.filter';
import { Global500MonitorFilter } from '@shared/filters/global-500-monitor.filter';
import { HttpCacheInterceptor } from '@shared/interceptors/http-cache.interceptor';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { CacheHeaderInterceptor } from '@shared/interceptors/cache-header.interceptor';
import { CacheService } from '@shared/cache/redis-cache/cache.service';
import { SingleFlightService } from '@shared/services/single-flight.service';
import { SingleFlightInterceptor } from '@shared/interceptors/single-flight.interceptor';
import { FilteredLogger } from '@shared/utils';

async function bootstrapApi() {
  const app = await NestFactory.create(AppApiModule, {
    logger: new FilteredLogger(),
  });
  const configService = app.get(ConfigService);

  // Get config
  const port = configService.get<number>('app.api.port');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  // Security headers
  app.use(helmet());

  // Cap JSON body size to prevent body-based DoS
  app.use(json({ limit: '1mb' }));

  // Global prefix
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, // /api/v1/..., /api/v2/...
    defaultVersion: '1', // Default v1
  });

  // CORS — credentials: true is incompatible with origin: '*' and unnecessary
  // for Bearer-token auth (no cookies). Removed to avoid the browser-rejected
  // combination and to avoid silently widening credential scope.
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  // IMPORTANT: Filters execute in REVERSE order (LIFO - Last In First Out)
  // Order: Global500MonitorFilter (monitors 500) -> AppErrorFilter (formats AppError) -> HttpExceptionFilter (formats HttpException)
  app.useGlobalFilters(
    app.get(Global500MonitorFilter),
    new AppErrorFilter(),
    new HttpExceptionFilter(),
  );

  // Global interceptors
  const reflector = app.get(Reflector);
  const configServiceInstance = app.get(ConfigService);

  // Success responses are returned flat (matching the DTO described in
  // `@nestjs/swagger` decorators → `backend/openapi.yaml` → iOS-generated
  // `Client`). Error responses are wrapped by `AppErrorFilter` /
  // `HttpExceptionFilter` into `{ success: false, error: { code, message, ... } }`.
  // See `backend/CLAUDE.md` § Error System.
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new CacheHeaderInterceptor(reflector, configServiceInstance),
    new SingleFlightInterceptor(reflector, app.get(SingleFlightService)),
    new HttpCacheInterceptor(app.get(CacheService), reflector, configServiceInstance),
  );

  // Swagger — only in non-production to avoid exposing the full API surface
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
      },
    };

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, customOptions);
  }

  await app.listen(port);

  const bullBoardEnabled = configService.get<boolean>('bullboard.enabled');
  const bullBoardPath = configService.get<string>('bullboard.path');
  const bullBoardLine = bullBoardEnabled
    ? `\n  🐂 Bull Board: http://localhost:${port}/api${bullBoardPath}`
    : '';

  const swaggerLine =
    nodeEnv !== 'production'
      ? `\n  📚 Swagger documentation: http://localhost:${port}/api/docs`
      : '';

  console.log(`
  🚀 [API SERVER] Application is running on: http://localhost:${port}${swaggerLine}${bullBoardLine}
  `);
}

export { bootstrapApi };
