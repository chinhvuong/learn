import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { appConfig } from '@config/app.config';
import { databaseConfig } from '@config/database.config';
import { redisConfig } from '@config/redis.config';
import { jwtConfig } from '@config/jwt.config';
import { bullmqConfig } from '@config/bullmq.config';
import { bullboardConfig } from '@config/bullboard.config';
import { storageConfig } from '@config/storage.config';
import { firebaseConfig } from '@config/firebase.config';

// Infrastructure
import { DatabaseModule } from '@database/database.module';
import { RedisCacheModule } from '@shared/cache/redis-cache/redis-cache.module';
import { RedisAdapterModule } from '@shared/cache/redis-adapter/redis-adapter.module';
import { HttpCacheModule } from '@shared/cache/http-cache/http-cache.module';
import { StorageModule } from '@shared/storage/storage.module';
import { AuthModule, FirebaseAuthMiddleware } from '@shared/auth';
import { BullBoardConfigModule } from '../../bull-board/bull-board.module';

// Feature Modules (api-side)
import { UsersModule } from '@modules/users/users.module';
import { DemoApiModule } from '@modules/demo/demo-api.module';

// Controllers
import { HealthcheckController } from '@shared/controllers/healthcheck.controller';
import { ClientConfigController } from '@shared/controllers/client-config.controller';

// Providers
import { SingleFlightService } from '@shared/services/single-flight.service';
import { Global500MonitorFilter } from '@shared/filters/global-500-monitor.filter';

@Module({
  imports: [
    // ConfigModule.forRoot loads .env files synchronously into process.env on
    // this call — keep it first so the env-gated imports below see the
    // correct values.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        bullmqConfig,
        bullboardConfig,
        storageConfig,
        firebaseConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('bullmq'),
    }),
    DatabaseModule,
    RedisCacheModule,
    RedisAdapterModule,
    HttpCacheModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ...(process.env.BULLBOARD_ENABLED === 'true' ? [BullBoardConfigModule] : []),
    ...(process.env.DEMO_ENABLED === 'true' ? [DemoApiModule] : []),
  ],
  providers: [SingleFlightService, Global500MonitorFilter],
  controllers: [HealthcheckController, ClientConfigController],
})
export class AppApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Verifies Firebase ID token + upserts the matching `users` row on every
    // request. Healthcheck + Bull Board exemptions live inside the middleware
    // itself (see `shouldBypassAuth`) because Nest's `exclude(...)` patterns
    // didn't match here — `forRoutes('*')` rewrites `req.url` to `/`, so the
    // path matcher never sees the real URL.
    consumer.apply(FirebaseAuthMiddleware).forRoutes('*');
  }
}
