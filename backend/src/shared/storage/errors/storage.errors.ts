import { createErrorFactory } from '@shared/errors/app-errors';

const storageErrors = {
  STORAGE_OBJECT_NOT_FOUND: {
    code: 'STORAGE_OBJECT_NOT_FOUND',
    message: (key: string) => `Object not found at key: ${key}`,
    statusCode: 404,
  },
  STORAGE_UPLOAD_FAILED: {
    code: 'STORAGE_UPLOAD_FAILED',
    message: (key: string, reason: string) => `Upload failed for key ${key}: ${reason}`,
    statusCode: 500,
  },
  STORAGE_DOWNLOAD_FAILED: {
    code: 'STORAGE_DOWNLOAD_FAILED',
    message: (key: string, reason: string) => `Download failed for key ${key}: ${reason}`,
    statusCode: 500,
  },
  STORAGE_DELETE_FAILED: {
    code: 'STORAGE_DELETE_FAILED',
    message: (key: string, reason: string) => `Delete failed for key ${key}: ${reason}`,
    statusCode: 500,
  },
  STORAGE_TIMEOUT: {
    code: 'STORAGE_TIMEOUT',
    message: (key: string) => `Storage request timed out for key: ${key}`,
    statusCode: 504,
  },
  STORAGE_INVALID_CONFIG: {
    code: 'STORAGE_INVALID_CONFIG',
    message: (detail: string) => `Storage configuration invalid: ${detail}`,
    statusCode: 500,
  },
} as const;

export const storageErrorFactory = createErrorFactory(storageErrors);
