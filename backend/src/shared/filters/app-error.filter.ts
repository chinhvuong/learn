import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { AppError } from '../errors/app-errors';
import { Request, Response } from 'express';

@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: AppError<any>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.debug(
      `[${exception.statusCode}] ${exception.errorCode} - ${exception.message} | ${request.method} ${request.url}`,
      exception.stack,
    );

    const errorResponse = {
      success: false,
      error: {
        code: exception.errorCode,
        message: exception.message,
        statusCode: exception.statusCode,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    return response.status(exception.statusCode).json(errorResponse);
  }
}

// Usage in main.ts:
// app.useGlobalFilters(new SimpleErrorFilter());
