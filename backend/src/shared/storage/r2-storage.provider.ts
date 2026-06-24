import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import type { ObjectBytes, ObjectStorageProvider, UploadResult } from './object-storage.provider';
import { storageErrorFactory } from './errors/storage.errors';

interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucketName: string;
  endpointUrl: string;
  publicUrlBase: string;
}

@Injectable()
export class R2StorageProvider implements ObjectStorageProvider, OnModuleDestroy {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly client: S3Client;
  private readonly r2: R2Config;

  constructor(private readonly configService: ConfigService) {
    const r2 = this.configService.get<R2Config>('storage.r2');
    const timeoutMs = this.configService.get<number>('storage.requestTimeoutMs') ?? 30_000;

    if (!r2) {
      throw storageErrorFactory.STORAGE_INVALID_CONFIG('missing storage.r2 namespace');
    }
    this.r2 = r2;

    this.client = new S3Client({
      region: 'auto',
      endpoint: r2.endpointUrl,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
      requestHandler: new NodeHttpHandler({
        connectionTimeout: timeoutMs,
        requestTimeout: timeoutMs,
      }),
    });
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  async upload(key: string, bytes: Buffer, mime: string): Promise<UploadResult> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.r2.bucketName,
          Key: key,
          Body: bytes,
          ContentType: mime,
          ContentLength: bytes.byteLength,
        }),
      );
      return { key, publicUrl: this.publicUrl(key) };
    } catch (error) {
      throw this.mapError(error, 'upload', key);
    }
  }

  async getBytes(key: string): Promise<ObjectBytes> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.r2.bucketName,
          Key: key,
        }),
      );

      if (!response.Body) {
        throw storageErrorFactory.STORAGE_DOWNLOAD_FAILED(key, 'empty response body');
      }

      const bytes = Buffer.from(await response.Body.transformToByteArray());
      const mime = response.ContentType ?? 'application/octet-stream';
      return { bytes, mime };
    } catch (error) {
      throw this.mapError(error, 'download', key);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.r2.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      // Deleting a missing object is idempotent — swallow 404.
      if (this.isNotFound(error)) {
        this.logger.debug(`delete: object ${key} already absent`);
        return;
      }
      throw this.mapError(error, 'delete', key);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.r2.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (this.isNotFound(error)) return false;
      throw this.mapError(error, 'download', key);
    }
  }

  publicUrl(key: string): string {
    const trimmedKey = key.replace(/^\/+/, '');
    return `${this.r2.publicUrlBase}/${trimmedKey}`;
  }

  private isNotFound(error: unknown): boolean {
    if (error instanceof NoSuchKey || error instanceof NotFound) return true;
    if (error instanceof S3ServiceException) {
      return (
        error.name === 'NoSuchKey' ||
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      );
    }
    return false;
  }

  private isTimeout(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
      error.name === 'TimeoutError' ||
      error.name === 'RequestAbortedException' ||
      error.name === 'AbortError'
    );
  }

  private mapError(error: unknown, op: 'upload' | 'download' | 'delete', key: string): Error {
    if (this.isNotFound(error)) {
      return storageErrorFactory.STORAGE_OBJECT_NOT_FOUND(key);
    }
    if (this.isTimeout(error)) {
      return storageErrorFactory.STORAGE_TIMEOUT(key);
    }

    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    this.logger.error(`${op} failed for key ${key}: ${reason}`);

    switch (op) {
      case 'upload':
        return storageErrorFactory.STORAGE_UPLOAD_FAILED(key, reason);
      case 'download':
        return storageErrorFactory.STORAGE_DOWNLOAD_FAILED(key, reason);
      case 'delete':
        return storageErrorFactory.STORAGE_DELETE_FAILED(key, reason);
    }
  }
}
