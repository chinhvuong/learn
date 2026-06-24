import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { appConfig } from '@config/app.config';
import { databaseConfig } from '@config/database.config';
import { redisConfig } from '@config/redis.config';
import { bullmqConfig } from '@config/bullmq.config';
import { storageConfig } from '@config/storage.config';
import { firebaseConfig } from '@config/firebase.config';

// Infrastructure
import { DatabaseModule } from '@database/database.module';
import { RedisCacheModule } from '@shared/cache/redis-cache/redis-cache.module';
import { StorageModule } from '@shared/storage/storage.module';

// Feature Modules (worker-side)
import { DemoWorkerModule } from '@modules/demo/demo-worker.module';

// Controllers
import { HealthcheckController } from '@shared/controllers/healthcheck.controller';

/**
 * Worker bootstrap module.
 *
 * Imports the *-worker.module.ts of every feature whose background work
 * (BullMQ processors, @nestjs/schedule cron sweepers) must run in the worker
 * process. Never imports the *-api.module.ts variants — those hold HTTP
 * controllers that have no place in a headless worker.
 *
 * Each feature is split into shared / api / worker sub-modules; see the demo
 * module for the reference pattern.
 */
@Module({
  imports: [
    // ConfigModule.forRoot loads .env files synchronously into process.env on
    // this call — keep it first so the env-gated imports below see the
    // correct values.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, bullmqConfig, storageConfig, firebaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('bullmq'),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisCacheModule,
    StorageModule,
    ...(process.env.DEMO_ENABLED === 'true' ? [DemoWorkerModule] : []),
  ],
  controllers: [HealthcheckController],
})
export class AppWorkerModule {}
