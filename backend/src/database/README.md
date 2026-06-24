# Database Module Structure

## Overview

PostgreSQL is the only database for Inflow (OLTP for business logic).

## Directory Structure

```
src/database/
├── constants/                   # Shared constants (column types, TypeORM module options)
│   ├── column-types.ts
│   ├── typeorm-module-options.ts
│   └── index.ts
│
├── postgres/                    # PostgreSQL module
│   ├── entities/                # Entity definitions (extend AbstractEntity)
│   │   └── abstract.entity.ts
│   ├── repositories/            # Repository implementations (extend AbstractRepository)
│   │   └── abstract.repository.ts
│   ├── migrations/              # TypeORM migrations
│   ├── postgres.data-source.ts  # TypeORM DataSource (CLI uses this)
│   ├── postgres.module.ts       # NestJS module
│   └── index.ts                 # Barrel exports
│
├── database.module.ts           # Wraps PostgresModule
└── README.md
```

## DataSource

`postgres/postgres.data-source.ts` is the TypeORM CLI entry point — used to generate, run, and revert migrations.

## Module

`postgres/postgres.module.ts` is the runtime NestJS module. Register entities in the `entities` array and repositories in the `repositories` array; both are also exported from `index.ts`.

## Repositories

```ts
@Injectable()
export class UsersRepository extends AbstractRepository<UserEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(UserEntity, dataSource);
  }
}
```

The connection name is always `'postgres'`.

## Migration Commands

```bash
yarn migration:generate AddUserTable    # diff entities → migration
yarn migration:create  SeedInitialData  # empty migration
yarn migration:run
yarn migration:revert
yarn migration:show
```

## Documentation

- **Migration script wrappers:** `scripts/`
- **TypeORM:** https://typeorm.io/
- **NestJS TypeORM:** https://docs.nestjs.com/techniques/database
