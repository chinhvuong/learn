import { AxiosResponse, AxiosError } from 'axios';
import { Logger } from '@nestjs/common';

export const createResponseInterceptor = (logger: Logger, clientName: string) => {
  return {
    onFulfilled: (response: AxiosResponse) => {
      logger.debug(`[${clientName}] Response ${response.status} from ${response.config.url}`);
      return response;
    },
    onRejected: (error: unknown) => {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? 'No status';
      const method = axiosError.config?.method?.toUpperCase() ?? 'UNKNOWN';
      const url = axiosError.config?.url ?? 'unknown endpoint';

      logger.error(
        `[${clientName}] ${method} ${url} failed with status ${status}: ${axiosError.message}`,
      );
      return Promise.reject(error instanceof Error ? error : new Error('Unknown response error'));
    },
  };
};
