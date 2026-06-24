import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TYPEORM_MODULE_OPTIONS } from '@database/constants/typeorm-module-options';

import { UserEntity } from './entities/user.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import { UserProfilesRepository } from './repositories/user-profile.repository';
import { UsersRepository } from './repositories/user.repository';

const entities = [UserEntity, UserProfileEntity];
const repositories = [UsersRepository, UserProfilesRepository];

/**
 * PostgreSQL Database Module
 * Handles all transactional (OLTP) data
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'postgres',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isLogging = configService.get<boolean>('database.logging') || false;

        const config: TypeOrmModuleOptions = {
          type: 'postgres' as const,
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          autoLoadEntities: true,
          entities,
          migrations: [],
          migrationsRun: false,
          synchronize: false,
          logging: isLogging,
          ...(isLogging && {
            logger: TYPEORM_MODULE_OPTIONS.logger,
            maxQueryExecutionTime: TYPEORM_MODULE_OPTIONS.maxQueryExecutionTime,
          }),
        };

        return config;
      },
    }),
    TypeOrmModule.forFeature(entities, 'postgres'),
  ],
  providers: [...repositories],
  exports: [TypeOrmModule, ...repositories],
})
export class PostgresModule {}
