import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AppError } from '@shared/errors/app-errors';

/**
 * Global Exception Filter for monitoring 500 Internal Server Errors
 *
 * This filter catches ALL exceptions from ANY layer (Guards, Interceptors, Controllers, Services)
 * and logs 500 errors.
 *
 * NestJS Filter Execution Order (LIFO - Last In First Out):
 * 1. Global500MonitorFilter (this one) - monitors and logs errors
 * 2. AppErrorFilter - formats AppError responses
 * 3. HttpExceptionFilter - formats HttpException responses
 */
@Injectable()
@Catch() // Catch ALL exceptions (no parameters = catch everything)
export class Global500MonitorFilter implements ExceptionFilter {
  private readonly logger = new Logger(Global500MonitorFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    // Extract status code from exception
    const statusCode = this.getStatusCode(exception);

    // Log 500 Internal Server Errors
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `500 ERROR: ${request.method} ${request.url} - ${exception?.message || 'Unknown error'}`,
        exception?.stack,
      );
    }

    // Check if this is an AppError (custom error)
    if (exception instanceof AppError) {
      // Let AppErrorFilter handle it
      throw exception;
    }

    // Check if this is an HttpException (NestJS built-in)
    if (exception instanceof HttpException) {
      // Format HttpException response as JSON
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message || exception.message;

      return response.status(statusCode).json({
        statusCode: statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    }

    // For all other exceptions (including errors from Guards), format as JSON.
    // In production, suppress the raw exception message to avoid leaking
    // internal details (TypeORM relation names, storage keys, etc.).
    const isProd = process.env.NODE_ENV === 'production';
    return response.status(statusCode).json({
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: isProd ? 'Internal server error' : exception?.message || 'Internal server error',
      error: !isProd ? exception?.stack : undefined,
    });
  }

  /**
   * Extract status code from various exception types
   */
  private getStatusCode(exception: any): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof AppError) {
      return exception.statusCode;
    }

    if (exception?.status) {
      return exception.status;
    }

    if (exception?.statusCode) {
      return exception.statusCode;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
