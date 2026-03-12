export interface PipelineUploadMetadata {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface PipelineContextMeta {
  model?: string;
  promptVersion?: string;
  latencyMs?: number;
}

export interface PipelineContext {
  userId: string;
  uploadId: string;
  warnings: string[];
  executedStages: string[];
  meta: PipelineContextMeta;
  upload?: PipelineUploadMetadata;
  fileBuffer?: Buffer;
  extractedText?: string;
}
