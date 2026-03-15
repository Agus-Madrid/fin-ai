export interface UploadFileResult {
  filename: string;
  body: Buffer;
  contentType: string;
  sizeBytes: number;
}
