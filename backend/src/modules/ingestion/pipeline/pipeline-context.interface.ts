import type { ExtractedTransaction } from '../../../core/ai/interfaces';

export interface PipelineUploadMetadata {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface PipelineContextMeta {
  model?: string;
  promptVersion?: string;
  latencyMs?: number;
  textSource?: 'embedded-pdf-text' | 'ocr' | 'none';
  ocrProvider?: string;
}

export interface PipelineContext {
  userId: string;
  uploadId: string;
  pipelineStartedAtMs?: number;
  warnings: string[];
  executedStages: string[];
  stageLatenciesMs: Record<string, number>;
  meta: PipelineContextMeta;
  upload?: PipelineUploadMetadata;
  fileBuffer?: Buffer;
  extractedText?: string;
  extractedTransactions?: ExtractedTransaction[];
  persistedPendingTransactionsCount?: number;
  skippedPendingTransactionsCount?: number;
}
