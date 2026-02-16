export type UploadStatus = 'pending' | 'processed' | 'error';

export interface UploadItem {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedLabel: string;
  status: UploadStatus;
  extractedCount?: number;
}

export interface UploadVm {
  uploads: UploadItem[];
}
