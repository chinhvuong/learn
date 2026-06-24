import { Logger } from '@nestjs/common';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

/**
 * Base class for all BullMQ processors in Inflow.
 *
 * Provides:
 *   - A scoped NestJS Logger named after the concrete subclass.
 *   - A standard `onFailed` hook that logs only on the final attempt to avoid
 *     log spam when stateless jobs retry (CAS jobs run with `attempts: 1`, so
 *     for them this fires every time).
 *
 * Subclasses MUST implement `process(job)`. For CAS state-machine jobs the
 * processor must NEVER throw — losing the CAS claim or hitting a domain
 * failure should set the row state in the DB and return success, so BullMQ
 * does not retry the wakeup signal. See ADR 0001 for the full pattern.
 */
export abstract class QueueProcessorBase<TData = unknown, TResult = void> extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);

  abstract process(job: Job<TData>): Promise<TResult>;

  @OnWorkerEvent('failed')
  onFailed(job: Job<TData> | undefined, error: Error): void {
    if (!job) {
      this.logger.error(`Job failed (no job context): ${error.message}`, error.stack);
      return;
    }

    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

    if (isLastAttempt) {
      this.logger.error(
        `Job ${job.name} (id=${job.id}) failed permanently after ${job.attemptsMade + 1} attempt(s): ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.warn(
        `Job ${job.name} (id=${job.id}) failed on attempt ${job.attemptsMade + 1}/${maxAttempts}, will retry: ${error.message}`,
      );
    }
  }
}
