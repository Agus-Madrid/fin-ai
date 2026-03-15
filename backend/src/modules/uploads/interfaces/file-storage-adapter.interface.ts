export type StorageProvider = 'local' | 's3';

export interface SaveFileInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface ReadFileResult {
  body: Buffer;
  contentType: string;
  sizeBytes: number;
}

export interface FileStorageAdapter {
  readonly provider: StorageProvider;
  saveFile(input: SaveFileInput): Promise<void>;
  readFile(key: string): Promise<ReadFileResult>;
}
