export interface UploadIngestionResponse {
  uploadId: string;
  status: 'TEXT_EXTRACTED';
  extractedTextLength: number;
  textSource: 'embedded-pdf-text' | 'ocr' | 'none';
  filename: string;
  contentType: string;
  sizeBytes: number;
  warnings: string[];
  executedStages: string[];
}
