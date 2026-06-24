# Inflow Backend

NestJS backend for Inflow (a learning app) — a REST API (`api`) plus a BullMQ worker (`worker`) that runs background jobs.

## Stack

- NestJS 11 · TypeORM · PostgreSQL 15
- Redis 7 (cache + BullMQ broker)
- Firebase Admin (ID-token auth) · JWT (Passport) infrastructure
- Cloudflare R2 (S3-compatible object storage)
- Swagger (served at runtime)

## Setup

```bash
yarn install
docker-compose up -d              # postgres + redis
cp .env.example .env              # then edit
yarn migration:run
yarn start:all:dev                # api + worker in one process
```

## Service Topology

| `SERVICE_TYPE` | What it runs |
|---|---|
| `api` | REST endpoints |
| `worker` | BullMQ worker |
| `all` | Both, in one process (local dev only) |

```bash
yarn start:api:dev        # api only
yarn start:worker:dev     # worker only
```

## API Documentation

Swagger UI is served by the running API at `http://localhost:${API_PORT}/api/docs` (port from `.env`).

## Migrations

```bash
yarn migration:generate AddSomething   # auto-diff against entities
yarn migration:create  SeedSomething   # empty migration scaffold
yarn migration:run
yarn migration:revert
yarn migration:show
```

## Tests

```bash
yarn test:unit
```

## Project Structure

```
src/
├── bootstrap/         # api/, worker/, index.ts — SERVICE_TYPE split
├── config/            # app, database, redis, jwt, bullmq, bullboard, storage, firebase
├── database/postgres/ # entities (user, user-profile), repositories, module, migrations
├── modules/           # demo (api+worker reference), users
├── shared/            # auth, cache, network, queue, storage, utils, filters, guards, …
├── bull-board/        # queue dashboard
└── main.ts            # SERVICE_TYPE switch
```

The `demo/` module is the reference template for how a feature splits into shared / api / worker sub-modules.

## License

Proprietary — All rights reserved.
