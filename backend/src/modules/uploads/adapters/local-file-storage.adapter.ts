import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import {
  FileStorageAdapter,
  ReadFileResult,
  SaveFileInput,
} from '../interfaces/file-storage-adapter.interface';

export interface LocalFileStorageAdapterOptions {
  rootDir: string;
}

export class LocalFileStorageAdapter implements FileStorageAdapter {
  readonly provider = 'local' as const;
  private readonly rootDir: string;

  constructor(options: LocalFileStorageAdapterOptions) {
    this.rootDir = resolve(options.rootDir);
  }

  async saveFile(input: SaveFileInput): Promise<void> {
    const absolutePath = this.resolvePath(input.key);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.body);
  }

  async readFile(key: string): Promise<ReadFileResult> {
    const absolutePath = this.resolvePath(key);
    const body = await readFile(absolutePath);
    return {
      body,
      contentType: 'application/pdf',
      sizeBytes: body.byteLength,
    };
  }

  private resolvePath(key: string): string {
    const normalizedKey = key.replaceAll('\\', '/').replace(/^\/+/, '');
    const absolutePath = resolve(this.rootDir, normalizedKey);
    const relativePath = relative(this.rootDir, absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error('Invalid storage key path');
    }

    return absolutePath;
  }
}
