export type UploadStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UploadResponseDto {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: UploadStatus;
  createdAt: Date;
  fileUrl: string;
}
