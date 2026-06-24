export interface UploadResult {
  key: string;
  publicUrl: string;
}

export interface ObjectBytes {
  bytes: Buffer;
  mime: string;
}

export interface ObjectStorageProvider {
  upload(key: string, bytes: Buffer, mime: string): Promise<UploadResult>;
  getBytes(key: string): Promise<ObjectBytes>;
  delete(key: string): Promise<void>;
  /** True if an object exists at `key`. Used by the seeder to skip re-uploads. */
  exists(key: string): Promise<boolean>;
  publicUrl(key: string): string;
}

export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER');
