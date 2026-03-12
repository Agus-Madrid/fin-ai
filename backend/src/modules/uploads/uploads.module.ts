import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { User } from '../user/user.entity';
import { Upload } from './upload.entity';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { FILE_STORAGE_ADAPTER } from './uploads.constants';
import { LocalFileStorageAdapter } from './adapters/local-file-storage.adapter';
import { S3FileStorageAdapter } from './adapters/s3-file-storage.adapter';
import { FileStorageAdapter } from './interfaces/file-storage-adapter.interface';

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value.trim().toLowerCase() === 'true';
}

function createStorageAdapter(): FileStorageAdapter {
  const driver = (process.env.UPLOAD_STORAGE_DRIVER ?? 'local')
    .trim()
    .toLowerCase();

  if (driver === 's3') {
    return new S3FileStorageAdapter({
      endpoint: process.env.UPLOAD_S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.UPLOAD_S3_REGION ?? 'us-east-1',
      accessKeyId: process.env.UPLOAD_S3_ACCESS_KEY_ID ?? 'minioadmin',
      secretAccessKey: process.env.UPLOAD_S3_SECRET_ACCESS_KEY ?? 'minioadmin',
      bucket: process.env.UPLOAD_S3_BUCKET ?? 'finai-uploads',
      forcePathStyle: parseBoolean(
        process.env.UPLOAD_S3_FORCE_PATH_STYLE,
        true,
      ),
    });
  }

  if (driver === 'local') {
    const rootDir =
      process.env.UPLOAD_LOCAL_ROOT_DIR ?? resolve('storage', 'uploads');
    return new LocalFileStorageAdapter({
      rootDir,
    });
  }

  throw new Error(`Unsupported upload storage driver "${driver}"`);
}

@Module({
  imports: [TypeOrmModule.forFeature([Upload, User])],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: FILE_STORAGE_ADAPTER,
      useFactory: createStorageAdapter,
    },
  ],
})
export class UploadsModule {}
