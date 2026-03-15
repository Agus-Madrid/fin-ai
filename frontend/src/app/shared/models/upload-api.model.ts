export type ApiUploadStatus =
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING'
  | 'PROCESSED';

export interface UploadApiModel {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: ApiUploadStatus;
  createdAt: string;
  fileUrl: string;
}
