import { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Logger } from '@nestjs/common';

export const createRequestInterceptor = (logger: Logger, clientName: string) => {
  return {
    onFulfilled: (config: InternalAxiosRequestConfig) => {
      logger.debug(`[${clientName}] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    onRejected: (error: unknown) => {
      const axiosError = error as AxiosError;
      logger.error(`[${clientName}] Request error:`, axiosError.message);
      return Promise.reject(error instanceof Error ? error : new Error('Unknown request error'));
    },
  };
};
