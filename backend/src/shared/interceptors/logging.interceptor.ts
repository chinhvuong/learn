import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { BaseError } from '@shared/errors/base.error';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const responseTime = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${statusCode} - ${responseTime}ms - ${ip} - ${userAgent}`,
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;

        // Determine status code from different error types
        let statusCode = 500;
        if (error instanceof HttpException) {
          // NestJS HttpException (includes custom exceptions extending it)
          statusCode = error.getStatus();
        } else if (error instanceof BaseError) {
          // AppError extends BaseError, both have statusCode
          statusCode = error.statusCode;
        } else if (typeof error === 'object' && error !== null) {
          // Fallback: check for statusCode or status properties
          if (typeof error.statusCode === 'number') {
            statusCode = error.statusCode;
          } else if (typeof error.status === 'number') {
            statusCode = error.status;
          }
        }

        // Safely get error message
        const errorMessage =
          error instanceof Error ? error.message : String(error ?? 'Unknown error');

        this.logger.error(
          `${method} ${url} ${statusCode} - ${responseTime}ms - ${ip} - ${userAgent} - ${errorMessage}`,
        );
        throw error;
      }),
    );
  }
}
