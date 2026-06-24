import { Module } from '@nestjs/common';
import { OBJECT_STORAGE_PROVIDER } from './object-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';

@Module({
  providers: [
    R2StorageProvider,
    {
      provide: OBJECT_STORAGE_PROVIDER,
      useExisting: R2StorageProvider,
    },
  ],
  exports: [OBJECT_STORAGE_PROVIDER],
})
export class StorageModule {}
