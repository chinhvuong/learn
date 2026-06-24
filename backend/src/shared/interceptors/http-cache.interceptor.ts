// cache/http-cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CacheService } from '@shared/cache/redis-cache/cache.service';
import {
  HTTP_CACHE_TTL_KEY,
  HTTP_CACHE_KEY_KEY,
  HTTP_NO_CACHE_KEY,
} from '@shared/decorators/http-cache.decorator';
import { CACHE_KEYS } from '@constants/cache-keys.constant';

type HandlerFunction = (...args: any[]) => any;

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);
  private readonly defaultTTLSeconds = 10;

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpCacheEnabled = this.configService.get<boolean>('app.api.httpCacheEnabled', true);
    if (!httpCacheEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler() as HandlerFunction;

    // Step 1: Check if cache is explicitly disabled
    if (this.isCacheDisabled(handler)) {
      return next.handle();
    }

    // Step 2: Extract cache decorators
    const cacheConfig = this.extractCacheConfig(handler);

    // Step 3: Validate request method
    if (!this.isGetRequest(request)) {
      this.warnIfCacheDecoratorsOnNonGet(request, cacheConfig);
      return next.handle();
    }

    // Step 4: Check if cache is explicitly enabled
    // if (!this.isCacheEnabled(cacheConfig)) {
    //   return next.handle();
    // }

    // Step 5: Generate cache key and TTL
    const ttl = cacheConfig.ttl ?? this.defaultTTLSeconds;
    const cacheKey = this.generateCacheKey(request, cacheConfig.customKey);

    // Step 6: Try to retrieve from cache
    const cachedResponse = await this.tryGetFromCache(cacheKey);
    if (cachedResponse !== null) {
      return of(cachedResponse);
    }

    // Step 7: Execute handler and cache the response
    return this.executeAndCache(next, cacheKey, ttl, response);
  }

  // ==================== Cache Control Logic ====================

  private isCacheDisabled(handler: HandlerFunction): boolean {
    return this.reflector.get<boolean>(HTTP_NO_CACHE_KEY, handler) ?? false;
  }

  private extractCacheConfig(handler: HandlerFunction) {
    return {
      ttl: this.reflector.get<number>(HTTP_CACHE_TTL_KEY, handler),
      customKey: this.reflector.get<string>(HTTP_CACHE_KEY_KEY, handler),
    };
  }

  private isCacheEnabled(config: { ttl?: number; customKey?: string }): boolean {
    return config.ttl !== undefined || config.customKey !== undefined;
  }

  // ==================== Request Validation ====================

  private isGetRequest(request: Request): boolean {
    return request.method === 'GET';
  }

  private warnIfCacheDecoratorsOnNonGet(
    request: Request,
    config: { ttl?: number; customKey?: string },
  ): void {
    if (config.ttl !== undefined || config.customKey) {
      this.logger.warn(
        `Cache decorators (@HttpCacheTTL/@HttpCacheKey) are only effective for GET requests. ` +
          `Method ${request.method} on ${request.path} will not be cached.`,
      );
    }
  }

  // ==================== Cache Operations ====================

  private async tryGetFromCache(cacheKey: string): Promise<any | null> {
    try {
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        this.logger.debug(`HTTP Cache HIT: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`HTTP Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`HTTP Cache GET error: ${cacheKey}`, error);
      return null;
    }
  }

  private executeAndCache(
    next: CallHandler,
    cacheKey: string,
    ttl: number,
    response: Response,
  ): Observable<any> {
    return next.handle().pipe(
      tap(async (data) => {
        if (this.shouldCache(data, response.statusCode)) {
          await this.setCache(cacheKey, data, ttl);
        }
      }),
    );
  }

  private async setCache(cacheKey: string, data: any, ttl: number): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, data, ttl);
      this.logger.debug(`HTTP Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`HTTP Cache SET error: ${cacheKey}`, error);
    }
  }

  // ==================== Cache Key Generation ====================

  private generateCacheKey(request: Request, customKey?: string): string {
    if (customKey) {
      return this.generateCustomCacheKey(request, customKey);
    }

    return this.generateAutoCacheKey(request);
  }

  private generateCustomCacheKey(request: Request, customKey: string): string {
    const userId = this.getUserId(request);

    return CACHE_KEYS.HTTP_CACHE.CUSTOM(customKey, userId);
  }

  private generateAutoCacheKey(request: Request): string {
    const path = this.extractPath(request);
    const queryString = this.buildQueryString(request.query);
    const userId = this.getUserId(request);

    return CACHE_KEYS.HTTP_CACHE.AUTO(path, queryString, userId);
  }

  private extractPath(request: Request): string {
    return request.path || request.url.split('?')[0];
  }

  private buildQueryString(queryParams: any): string {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return '';
    }

    const sortedQuery = this.sortQueryParams(queryParams);
    return JSON.stringify(sortedQuery);
  }

  private sortQueryParams(queryParams: any): Record<string, any> {
    const sortedKeys = Object.keys(queryParams).sort();
    const sorted: Record<string, any> = {};

    sortedKeys.forEach((key) => {
      sorted[key] = queryParams[key];
    });

    return sorted;
  }

  private getUserId(request: Request): string | null {
    const user = (request as any).user;
    if (!user) return null;

    return user.id || user.userId || user._id || null;
  }

  // ==================== Response Validation ====================

  private shouldCache(response: any, httpStatusCode?: number): boolean {
    if (this.isNullOrUndefined(response)) {
      return false;
    }

    if (this.isErrorStatusCode(httpStatusCode)) {
      this.logger.warn(`Skipping cache for error status: ${httpStatusCode}`);
      return false;
    }

    if (this.isErrorResponse(response)) {
      this.logger.warn(`Skipping cache for error response`);
      return false;
    }

    return true;
  }

  private isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
  }

  private isErrorStatusCode(statusCode?: number): boolean {
    return statusCode !== undefined && statusCode >= 400;
  }

  private isErrorResponse(response: any): boolean {
    // Check status code in response object
    if (response?.statusCode && response.statusCode >= 400) {
      return true;
    }

    // Check error property
    if (response?.error) {
      return true;
    }

    return false;
  }
}
