import { Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createRequestInterceptor } from '../interceptors/request.interceptor';
import { createResponseInterceptor } from '../interceptors/response.interceptor';

export interface IBaseAxiosRequest extends AxiosRequestConfig {
  delayTimeMs?: number;
}

export type IBaseClientConfig = Pick<
  AxiosRequestConfig,
  'headers' | 'httpsAgent' | 'httpAgent' | 'decompress' | 'responseType' | 'paramsSerializer'
>;

export interface IProxyConfig {
  enabled: boolean;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  url?: string;
}

export class BaseClient {
  public instance: AxiosInstance;
  protected readonly logger: Logger;
  private clientName: string;

  constructor(baseURL: string, clientName: string, config?: IBaseClientConfig) {
    this.clientName = clientName;
    this.logger = new Logger(`${clientName}Client`);

    const axiosConfig: IBaseAxiosRequest = {
      baseURL,
      timeout: 15 * 1000, // 15 seconds
      ...config,
    };

    this.instance = axios.create(axiosConfig);

    // HTTP-layer retry intentionally absent — see backend/CONTEXT.md `Per-call timeout`:
    // exceeding a per-call timeout must fail immediately so cron release / kill-switch
    // own recovery at the row level. BullMQ is a wakeup signal, not a retry engine.
    this.setupInterceptors();
  }

  static withProxy(
    baseURL: string,
    clientName: string,
    proxyConfig: IProxyConfig,
    baseConfig?: IBaseClientConfig,
  ): BaseClient {
    const config = { ...baseConfig };

    // Only setup proxy if enabled and URL is provided
    if (proxyConfig.enabled && proxyConfig.url) {
      const logger = new Logger(`${clientName}Client`);
      logger.log(`Initializing client with proxy: ${proxyConfig.host}:${proxyConfig.port}`);

      config.httpsAgent = new HttpsProxyAgent(proxyConfig.url);
    }

    return new BaseClient(baseURL, clientName, config);
  }

  private setupInterceptors(): void {
    const requestInterceptor = createRequestInterceptor(this.logger, this.clientName);
    const responseInterceptor = createResponseInterceptor(this.logger, this.clientName);

    this.instance.interceptors.request.use(
      requestInterceptor.onFulfilled,
      requestInterceptor.onRejected,
    );

    this.instance.interceptors.response.use(
      responseInterceptor.onFulfilled,
      responseInterceptor.onRejected,
    );
  }

  private requestWithAbort<T>(
    fn: () => Promise<AxiosResponse<T>>,
    timeoutMs?: number,
  ): { promise: Promise<AxiosResponse<T>>; controller: AbortController } {
    const controller = new AbortController();
    const timeout = timeoutMs ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);

    const promise = fn().finally(() => clearTimeout(timer));

    return { promise, controller };
  }

  public get<T = any>(urlPath: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);
    const mergedConfig = { ...config, signal: controller.signal };

    return this.instance.get<T>(urlPath, mergedConfig).finally(() => clearTimeout(timer));
  }

  public post<T = any>(
    urlPath: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);
    const mergedConfig = { ...config, signal: controller.signal };

    return this.instance.post<T>(urlPath, data, mergedConfig).finally(() => clearTimeout(timer));
  }

  public put<T = any>(
    urlPath: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);
    const mergedConfig = { ...config, signal: controller.signal };

    return this.instance.put<T>(urlPath, data, mergedConfig).finally(() => clearTimeout(timer));
  }

  public patch<T = any>(
    urlPath: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);
    const mergedConfig = { ...config, signal: controller.signal };

    return this.instance.patch<T>(urlPath, data, mergedConfig).finally(() => clearTimeout(timer));
  }

  public delete<T = any>(urlPath: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? 15 * 1000;
    const timer = setTimeout(() => controller.abort(), timeout);
    const mergedConfig = { ...config, signal: controller.signal };

    return this.instance.delete<T>(urlPath, mergedConfig).finally(() => clearTimeout(timer));
  }
}
