export interface PipelineRunSummary {
  userId: string;
  uploadId: string;
  executedStages: string[];
  stageLatenciesMs: Record<string, number>;
  totalLatencyMs: number;
  model: string;
  promptVersion: string;
  textSource: string;
  ocrProvider: string;
  extractedTransactionsCount: number;
  persistedPendingTransactionsCount: number;
  skippedPendingTransactionsCount: number;
  warningCount: number;
  warnings: string[];
}
