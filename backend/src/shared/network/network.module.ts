import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Network infrastructure module. `BaseClient` (clients/base.client.ts) is the
 * reusable Axios-backed HTTP client building block feature modules extend to
 * talk to upstream services. Register concrete clients here as providers.
 */
@Module({
  imports: [ConfigModule],
  providers: [],
  exports: [],
})
export class NetworkModule {}
