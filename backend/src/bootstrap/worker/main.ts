import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppWorkerModule } from './app.module';

async function bootstrapWorker() {
  const app = await NestFactory.create(AppWorkerModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.worker.port');

  if (port) {
    await app.listen(port);
  } else {
    await app.init();
  }

  console.log(`
  ⚙️  [WORKER] BullMQ worker running${port ? ` on port ${port}` : ''}.
  `);
}

export { bootstrapWorker };
