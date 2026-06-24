import { Injectable } from '@nestjs/common';

import { CreationCreditService } from '../../ports/lesson-engine.ports';

/**
 * Fake in-memory {@link CreationCreditService} for the tracer slice. Tracks a
 * per-owner balance; {@link consume} is called only on a successful creation, so
 * a failed creation leaves the balance untouched (CONTEXT.md → Creation Credit).
 * A real adapter persists the monthly allowance per learner Plan.
 */
@Injectable()
export class FakeCreationCreditService implements CreationCreditService {
  private readonly balances = new Map<string, number>();

  /** Test/seed helper: grant an owner some Creation Credits. */
  grant(ownerId: string, amount: number): void {
    this.balances.set(ownerId, (this.balances.get(ownerId) ?? 0) + amount);
  }

  remaining(ownerId: string): number {
    return this.balances.get(ownerId) ?? 0;
  }

  async hasCredit(ownerId: string): Promise<boolean> {
    return this.remaining(ownerId) > 0;
  }

  async consume(ownerId: string): Promise<void> {
    this.balances.set(ownerId, Math.max(0, this.remaining(ownerId) - 1));
  }
}
