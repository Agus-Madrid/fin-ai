export interface ProcessUploadResponseDto {
  uploadId: string;
  status: 'TEXT_EXTRACTED';
  extractedTextLength: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  warnings: string[];
  executedStages: string[];
}
