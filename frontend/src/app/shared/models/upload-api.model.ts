export type ApiUploadStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UploadApiModel {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: ApiUploadStatus;
  createdAt: string;
  fileUrl: string;
}
