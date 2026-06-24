/// <reference types="jest" />

import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { R2StorageProvider } from '@shared/storage/r2-storage.provider';

const R2_CONFIG = {
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret',
  accountId: 'test-account',
  bucketName: 'inflow-dev',
  endpointUrl: 'https://test-account.r2.cloudflarestorage.com',
  publicUrlBase: 'https://pub-test.r2.dev',
};

function buildConfigService(overrides: Partial<typeof R2_CONFIG> = {}): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === 'storage.r2') return { ...R2_CONFIG, ...overrides };
      if (key === 'storage.requestTimeoutMs') return 5_000;
      return undefined;
    }),
  } as unknown as ConfigService;
}

function buildProvider(overrides: Partial<typeof R2_CONFIG> = {}): {
  provider: R2StorageProvider;
  send: jest.Mock;
} {
  const provider = new R2StorageProvider(buildConfigService(overrides));
  const send = jest.fn();
  // Replace the real S3Client.send with a controllable mock.
  (provider as unknown as { client: { send: jest.Mock } }).client.send = send;
  return { provider, send };
}

describe('R2StorageProvider', () => {
  afterEach(() => jest.clearAllMocks());

  describe('constructor', () => {
    it('throws STORAGE_INVALID_CONFIG when storage.r2 namespace is missing', () => {
      const configService = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;

      expect(() => new R2StorageProvider(configService)).toThrow(/Storage configuration invalid/);
    });
  });

  describe('upload', () => {
    it('sends PutObjectCommand with bucket, key, body, mime, and content length', async () => {
      const { provider, send } = buildProvider();
      send.mockResolvedValueOnce({});

      const bytes = Buffer.from('hello-world');
      const result = await provider.upload('body-photos/abc.jpg', bytes, 'image/jpeg');

      expect(send).toHaveBeenCalledTimes(1);
      const command = send.mock.calls[0][0] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'inflow-dev',
        Key: 'body-photos/abc.jpg',
        Body: bytes,
        ContentType: 'image/jpeg',
        ContentLength: bytes.byteLength,
      });
      expect(result).toEqual({
        key: 'body-photos/abc.jpg',
        publicUrl: 'https://pub-test.r2.dev/body-photos/abc.jpg',
      });
    });

    it('maps NoSuchKey-style errors to STORAGE_OBJECT_NOT_FOUND', async () => {
      const { provider, send } = buildProvider();
      const notFound = new NoSuchKey({
        $metadata: { httpStatusCode: 404 },
        message: 'gone',
      });
      send.mockRejectedValueOnce(notFound);

      await expect(provider.upload('k', Buffer.from(''), 'image/jpeg')).rejects.toMatchObject({
        errorCode: 'STORAGE_OBJECT_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('maps timeout errors to STORAGE_TIMEOUT', async () => {
      const { provider, send } = buildProvider();
      const timeout = Object.assign(new Error('socket timeout'), { name: 'TimeoutError' });
      send.mockRejectedValueOnce(timeout);

      await expect(provider.upload('k', Buffer.from(''), 'image/jpeg')).rejects.toMatchObject({
        errorCode: 'STORAGE_TIMEOUT',
        statusCode: 504,
      });
    });

    it('maps generic SDK errors to STORAGE_UPLOAD_FAILED', async () => {
      const { provider, send } = buildProvider();
      const generic = new S3ServiceException({
        name: 'InternalError',
        $fault: 'server',
        $metadata: { httpStatusCode: 500 },
        message: 'oops',
      });
      send.mockRejectedValueOnce(generic);

      await expect(provider.upload('k', Buffer.from(''), 'image/jpeg')).rejects.toMatchObject({
        errorCode: 'STORAGE_UPLOAD_FAILED',
        statusCode: 500,
      });
    });
  });

  describe('getBytes', () => {
    it('sends GetObjectCommand and returns bytes + mime from ContentType', async () => {
      const { provider, send } = buildProvider();
      const payload = Buffer.from('payload-bytes');
      send.mockResolvedValueOnce({
        Body: {
          transformToByteArray: async () => new Uint8Array(payload),
        },
        ContentType: 'image/png',
      });

      const result = await provider.getBytes('results/xyz.jpg');

      const command = send.mock.calls[0][0] as GetObjectCommand;
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input).toEqual({ Bucket: 'inflow-dev', Key: 'results/xyz.jpg' });
      expect(result.mime).toBe('image/png');
      expect(result.bytes.equals(payload)).toBe(true);
    });

    it('defaults mime to application/octet-stream when ContentType missing', async () => {
      const { provider, send } = buildProvider();
      send.mockResolvedValueOnce({
        Body: { transformToByteArray: async () => new Uint8Array() },
      });

      const result = await provider.getBytes('k');
      expect(result.mime).toBe('application/octet-stream');
    });

    it('maps NoSuchKey to STORAGE_OBJECT_NOT_FOUND', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(
        new NoSuchKey({ $metadata: { httpStatusCode: 404 }, message: 'gone' }),
      );

      await expect(provider.getBytes('k')).rejects.toMatchObject({
        errorCode: 'STORAGE_OBJECT_NOT_FOUND',
      });
    });

    it('maps generic SDK errors to STORAGE_DOWNLOAD_FAILED', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'NetworkingError' }));

      await expect(provider.getBytes('k')).rejects.toMatchObject({
        errorCode: 'STORAGE_DOWNLOAD_FAILED',
      });
    });
  });

  describe('delete', () => {
    it('sends DeleteObjectCommand', async () => {
      const { provider, send } = buildProvider();
      send.mockResolvedValueOnce({});

      await provider.delete('outfits/xyz.jpg');

      const command = send.mock.calls[0][0] as DeleteObjectCommand;
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual({ Bucket: 'inflow-dev', Key: 'outfits/xyz.jpg' });
    });

    it('treats NoSuchKey as idempotent success', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(
        new NoSuchKey({ $metadata: { httpStatusCode: 404 }, message: 'gone' }),
      );

      await expect(provider.delete('k')).resolves.toBeUndefined();
    });

    it('maps non-404 errors to STORAGE_DELETE_FAILED', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'NetworkingError' }));

      await expect(provider.delete('k')).rejects.toMatchObject({
        errorCode: 'STORAGE_DELETE_FAILED',
      });
    });
  });

  describe('exists', () => {
    it('sends HeadObjectCommand and returns true when the object is present', async () => {
      const { provider, send } = buildProvider();
      send.mockResolvedValueOnce({});

      const result = await provider.exists('system-outfits/classic-1.jpg');

      expect(send).toHaveBeenCalledTimes(1);
      const command = send.mock.calls[0][0] as HeadObjectCommand;
      expect(command).toBeInstanceOf(HeadObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'inflow-dev',
        Key: 'system-outfits/classic-1.jpg',
      });
      expect(result).toBe(true);
    });

    it('returns false when the object is absent (NotFound)', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(new NotFound({ message: 'missing', $metadata: {} }));

      await expect(provider.exists('system-outfits/missing.jpg')).resolves.toBe(false);
    });

    it('rethrows non-404 errors', async () => {
      const { provider, send } = buildProvider();
      send.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'NetworkingError' }));

      await expect(provider.exists('k')).rejects.toMatchObject({
        errorCode: 'STORAGE_DOWNLOAD_FAILED',
      });
    });
  });

  describe('publicUrl', () => {
    it('concatenates publicUrlBase + key', () => {
      const { provider } = buildProvider();
      expect(provider.publicUrl('results/x.jpg')).toBe('https://pub-test.r2.dev/results/x.jpg');
    });

    it('strips leading slashes from key to avoid double slashes', () => {
      const { provider } = buildProvider();
      expect(provider.publicUrl('/leading.jpg')).toBe('https://pub-test.r2.dev/leading.jpg');
    });
  });

  describe('onModuleDestroy', () => {
    it('destroys the underlying S3Client', () => {
      const { provider } = buildProvider();
      const destroySpy = jest.spyOn(
        (provider as unknown as { client: { destroy: () => void } }).client,
        'destroy',
      );

      provider.onModuleDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
