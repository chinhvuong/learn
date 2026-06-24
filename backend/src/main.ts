import { EServiceType } from '@config/app.config';
import { bootstrapApi, bootstrapWorker } from './bootstrap';

/**
 * Main entry point — decides which service to start based on SERVICE_TYPE.
 *
 * Values:
 * - 'api' (default): REST API server
 * - 'worker': BullMQ worker
 * - 'all': API + Worker in the same process (local development)
 */
async function bootstrap() {
  const serviceType = process.env.SERVICE_TYPE || 'api';

  console.log(`🎯 Starting service type: ${serviceType.toUpperCase()}`);

  try {
    switch (serviceType.toLowerCase()) {
      case EServiceType.API:
        await bootstrapApi();
        break;

      case EServiceType.WORKER:
        await bootstrapWorker();
        break;

      case EServiceType.ALL:
        console.log('⚠️  Running API and Worker in parallel.');
        await Promise.all([bootstrapApi(), bootstrapWorker()]);
        console.log('\n✅ All services started.');
        break;

      default:
        console.error(`❌ Invalid SERVICE_TYPE: ${serviceType}`);
        console.error(`Valid values: ${Object.values(EServiceType).join(', ')}`);
        process.exit(1);
    }
  } catch (error: unknown) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();
