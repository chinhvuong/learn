import { ConsoleLogger } from '@nestjs/common';

export class FilteredLogger extends ConsoleLogger {
  warn(message: any, context?: string) {
    // Bỏ qua warning từ AmqpConnection về subscribe handler response
    if (
      typeof message === 'string' &&
      message.includes('Subscribe handlers should only return void')
    ) {
      return;
    }
    super.warn(message, context);
  }
}
