export interface ProcessUploadResponseDto {
  uploadId: string;
  status: 'PENDING_PERSISTED';
  extractedTextLength: number;
  textSource: 'embedded-pdf-text' | 'ocr' | 'none';
  filename: string;
  contentType: string;
  sizeBytes: number;
  persistedPendingTransactionsCount: number;
  skippedPendingTransactionsCount: number;
  warnings: string[];
  executedStages: string[];
}
