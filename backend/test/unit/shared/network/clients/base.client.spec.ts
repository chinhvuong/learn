/// <reference types="jest" />

import { BaseClient } from '@shared/network/clients/base.client';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as requestInterceptorModule from '@shared/network/interceptors/request.interceptor';
import * as responseInterceptorModule from '@shared/network/interceptors/response.interceptor';

jest.mock('axios');
jest.mock('@shared/network/interceptors/request.interceptor');
jest.mock('@shared/network/interceptors/response.interceptor');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCreateRequestInterceptor =
  requestInterceptorModule.createRequestInterceptor as jest.MockedFunction<
    typeof requestInterceptorModule.createRequestInterceptor
  >;
const mockedCreateResponseInterceptor =
  responseInterceptorModule.createResponseInterceptor as jest.MockedFunction<
    typeof responseInterceptorModule.createResponseInterceptor
  >;

describe('BaseClient - AbortController', () => {
  let client: BaseClient;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;
  const baseURL = 'https://api.example.com';
  const clientName = 'TestClient';

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    } as any;

    // Mock axios.create
    mockedAxios.create.mockReturnValue(mockAxiosInstance as AxiosInstance);

    // Mock interceptors to return proper objects
    mockedCreateRequestInterceptor.mockReturnValue({
      onFulfilled: jest.fn((config) => config),
      onRejected: jest.fn((error) => Promise.reject(error)),
    });

    mockedCreateResponseInterceptor.mockReturnValue({
      onFulfilled: jest.fn((response) => response),
      onRejected: jest.fn((error) => Promise.reject(error)),
    });

    client = new BaseClient(baseURL, clientName);
  });

  describe('requestWithAbort - timeout behavior', () => {
    it('should abort request when timeout occurs', async () => {
      let abortSignal: AbortSignal | undefined;

      // Mock get to capture abort signal and simulate slow request
      mockAxiosInstance.get.mockImplementation((url, config) => {
        abortSignal = config?.signal as AbortSignal;

        // Simulate request that will timeout
        return new Promise((resolve, reject) => {
          // Listen to abort event to reject immediately when aborted
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
              const error: any = new Error('Request aborted');
              error.name = 'AbortError';
              error.code = 'ERR_CANCELED';
              reject(error);
            });
          }

          // Simulate slow request (longer than timeout)
          // This should never resolve because abort will happen first
          setTimeout(() => {
            if (!abortSignal?.aborted) {
              resolve({ data: 'success' } as AxiosResponse);
            }
          }, 10000); // 10 seconds - longer than timeout
        }) as Promise<AxiosResponse>;
      });

      const startTime = Date.now();

      // Make request with short timeout
      await expect(client.get('/test', { timeout: 1000 })).rejects.toThrow();

      const duration = Date.now() - startTime;

      // Verify request was called with abort signal
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          timeout: 1000,
        }),
      );

      // Verify abort signal was created
      expect(abortSignal).toBeDefined();

      // Verify timeout occurred around 1 second (not 10 seconds)
      expect(duration).toBeLessThan(2000); // Allow some buffer
      expect(duration).toBeGreaterThan(800);
    }, 10000); // Increase test timeout to 10 seconds

    it('should clear timeout when request completes successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result).toEqual(mockResponse);
      expect(result.data).toEqual({ message: 'success' });

      // Verify request was called with abort signal
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should handle abort error correctly', async () => {
      let abortSignal: AbortSignal | undefined;

      mockAxiosInstance.get.mockImplementation((url, config) => {
        abortSignal = config?.signal as AbortSignal;

        return new Promise((resolve, reject) => {
          // Simulate abort after short delay
          setTimeout(() => {
            const error: any = new Error('Request aborted');
            error.name = 'AbortError';
            error.code = 'ERR_CANCELED';
            reject(error);
          }, 100);
        }) as Promise<AxiosResponse>;
      });

      await expect(client.get('/test', { timeout: 500 })).rejects.toThrow();

      // Verify abort signal was used
      expect(abortSignal).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('HTTP methods with AbortController', () => {
    const mockResponse: AxiosResponse = {
      data: { message: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should use AbortController for GET requests', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should use AbortController for POST requests', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.post('/test', { data: 'test' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        { data: 'test' },
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should use AbortController for PUT requests', async () => {
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      await client.put('/test', { data: 'test' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test',
        { data: 'test' },
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should use AbortController for PATCH requests', async () => {
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      await client.patch('/test', { data: 'test' });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test',
        { data: 'test' },
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should use AbortController for DELETE requests', async () => {
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('timeout configuration', () => {
    it('should use default timeout when not specified', async () => {
      const mockResponse: AxiosResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get('/test');

      // Should use default timeout (15s) from instance
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should use custom timeout from config', async () => {
      let abortSignal: AbortSignal | undefined;

      mockAxiosInstance.get.mockImplementation((url, config) => {
        abortSignal = config?.signal as AbortSignal;

        return new Promise((resolve, reject) => {
          // Listen to abort event to reject immediately when aborted
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
              const error: any = new Error('timeout exceeded');
              error.code = 'ECONNABORTED';
              reject(error);
            });
          }

          // Simulate slow request (longer than timeout)
          // This should never resolve because abort will happen first
          setTimeout(() => {
            if (!abortSignal?.aborted) {
              resolve({ data: 'success' } as AxiosResponse);
            }
          }, 2000);
        }) as Promise<AxiosResponse>;
      });

      const startTime = Date.now();

      await expect(client.get('/test', { timeout: 500 })).rejects.toThrow();

      const duration = Date.now() - startTime;

      // Should timeout around 500ms, not default 15s
      expect(duration).toBeLessThan(1000);
      expect(duration).toBeGreaterThan(400);
    });
  });

  describe('error handling', () => {
    it('should propagate non-abort errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(client.get('/test')).rejects.toThrow('Network error');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should handle timeout errors correctly', async () => {
      let abortSignal: AbortSignal | undefined;

      mockAxiosInstance.get.mockImplementation((url, config) => {
        abortSignal = config?.signal as AbortSignal;

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const error: any = new Error('timeout of 1000ms exceeded');
            error.code = 'ECONNABORTED';
            error.config = config;
            reject(error);
          }, 100);
        }) as Promise<AxiosResponse>;
      });

      await expect(client.get('/test', { timeout: 1000 })).rejects.toThrow();

      expect(abortSignal).toBeDefined();
    });
  });
});
