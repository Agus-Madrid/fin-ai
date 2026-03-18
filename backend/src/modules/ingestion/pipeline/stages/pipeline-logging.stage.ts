import { Injectable } from '@nestjs/common';
import { PipelineRunSummary } from '../interfaces/pipeline-logging';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class PipelineLoggingStage implements PipelineStage {
  readonly name = 'pipeline-logging';

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const summary = this.buildPipelineRunSummary(context);
    this.logPipelineRunSummary(summary);
    return context;
  }

  private buildPipelineRunSummary(
    context: PipelineContext,
  ): PipelineRunSummary {
    const totalLatencyMs = this.resolveTotalLatencyMilliseconds(context);

    return {
      userId: context.userId,
      uploadId: context.uploadId,
      executedStages: [...context.executedStages],
      stageLatenciesMs: { ...context.stageLatenciesMs },
      totalLatencyMs,
      model: context.meta.model ?? 'unknown',
      promptVersion: context.meta.promptVersion ?? 'unknown',
      textSource: context.meta.textSource ?? 'none',
      ocrProvider: context.meta.ocrProvider ?? 'none',
      extractedTransactionsCount: context.extractedTransactions?.length ?? 0,
      persistedPendingTransactionsCount:
        context.persistedPendingTransactionsCount ?? 0,
      skippedPendingTransactionsCount:
        context.skippedPendingTransactionsCount ?? 0,
      warningCount: context.warnings.length,
      warnings: [...context.warnings],
    };
  }

  private resolveTotalLatencyMilliseconds(context: PipelineContext): number {
    if (context.pipelineStartedAtMs !== undefined) {
      const elapsedMilliseconds = Date.now() - context.pipelineStartedAtMs;
      return elapsedMilliseconds > 0 ? elapsedMilliseconds : 0;
    }

    return context.meta.latencyMs ?? 0;
  }

  private logPipelineRunSummary(summary: PipelineRunSummary): void {
    console.log(
      '[IngestionPipeline] run summary',
      JSON.stringify(summary, null, 2),
    );
  }
}
