import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import {
  FileStorageAdapter,
  ReadFileResult,
  SaveFileInput,
} from '../interfaces/file-storage-adapter.interface';

export interface S3FileStorageAdapterOptions {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle: boolean;
}

export class S3FileStorageAdapter implements FileStorageAdapter {
  readonly provider = 's3' as const;
  private readonly bucket: string;
  private readonly client: S3Client;
  private bucketReadyPromise: Promise<void> | null = null;

  constructor(options: S3FileStorageAdapterOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async saveFile(input: SaveFileInput): Promise<void> {
    await this.ensureBucketExists();

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async readFile(key: string): Promise<ReadFileResult> {
    await this.ensureBucketExists();

    const output = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const body = await this.toBuffer(output.Body);
    const contentType = output.ContentType ?? 'application/pdf';
    const sizeBytes = output.ContentLength ?? body.byteLength;

    return {
      body,
      contentType,
      sizeBytes,
    };
  }

  private ensureBucketExists(): Promise<void> {
    this.bucketReadyPromise ??= this.createBucketIfMissing();

    return this.bucketReadyPromise;
  }

  private async createBucketIfMissing(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
      return;
    } catch (error: unknown) {
      if (!this.isMissingBucketError(error)) {
        throw error;
      }
    }

    await this.client.send(
      new CreateBucketCommand({
        Bucket: this.bucket,
      }),
    );
  }

  private isMissingBucketError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };

    if (candidate.$metadata?.httpStatusCode === 404) {
      return true;
    }

    const knownNames = ['NotFound', 'NoSuchBucket'];
    return (
      knownNames.includes(candidate.name ?? '') ||
      knownNames.includes(candidate.Code ?? '')
    );
  }

  private async toBuffer(body: unknown): Promise<Buffer> {
    if (!body) {
      return Buffer.alloc(0);
    }

    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }

    if (typeof body === 'object' && body !== null) {
      const withTransform = body as {
        transformToByteArray?: () => Promise<Uint8Array>;
      };
      if (typeof withTransform.transformToByteArray === 'function') {
        const bytes = await withTransform.transformToByteArray();
        return Buffer.from(bytes);
      }
    }

    const stream = body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      throw new Error('Unsupported stream chunk type');
    }

    return Buffer.concat(chunks);
  }
}
