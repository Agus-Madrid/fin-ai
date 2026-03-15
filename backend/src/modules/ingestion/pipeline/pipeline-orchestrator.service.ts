import { Injectable } from '@nestjs/common';
import { PipelineContext } from './pipeline-context.interface';
import { PipelineStage } from './pipeline-stage.interface';
import { CreateCategoriesStage } from './stages/create-categories.stage';
import { CurrencyExchangeStage } from './stages/currency-exchange.stage';
import { ExtractTextStage } from './stages/extract-text.stage';
import { IssueDescriptionStage } from './stages/issue-description.stage';
import { LlmExtractStage } from './stages/llm-extract.stage';
import { LoadUploadStage } from './stages/load-upload.stage';
import { OcrFallbackStage } from './stages/ocr-fallback.stage';
import { ResolveCategoriesStage } from './stages/resolve-categories.stage';
import { ValidationNormalizationStage } from './stages/validation-normalization.stage';
import { PersistPendingTransactionsStage } from './stages/persist-pending-transactions.stage';
import { PipelineLoggingStage } from './stages/pipeline-logging.stage';

@Injectable()
export class PipelineOrchestratorService {
  private readonly pipelineStages: PipelineStage[];

  constructor(
    private readonly loadUploadStage: LoadUploadStage,
    private readonly extractTextStage: ExtractTextStage,
    private readonly ocrFallbackStage: OcrFallbackStage,
    private readonly llmExtractStage: LlmExtractStage,
    private readonly validationNormalizationStage: ValidationNormalizationStage,
    private readonly resolveCategoriesStage: ResolveCategoriesStage,
    private readonly createCategoriesStage: CreateCategoriesStage,
    private readonly currencyExchangeStage: CurrencyExchangeStage,
    private readonly issueDescriptionStage: IssueDescriptionStage,
    private readonly persistPendingTransactionsStage: PersistPendingTransactionsStage,
    private readonly pipelineLoggingStage: PipelineLoggingStage,
  ) {
    this.pipelineStages = [
      loadUploadStage,
      extractTextStage,
      ocrFallbackStage,
      llmExtractStage,
      validationNormalizationStage,
      resolveCategoriesStage,
      createCategoriesStage,
      currencyExchangeStage,
      issueDescriptionStage,
      persistPendingTransactionsStage,
      pipelineLoggingStage,
    ];
  }

  async executeUploadIngestionPipeline(
    initialContext: PipelineContext,
  ): Promise<PipelineContext> {
    let context = this.initializePipelineContext(initialContext);
    const pipelineStartMs = context.pipelineStartedAtMs ?? this.readCurrentTimestampMs();

    for (const stage of this.pipelineStages) {
      context = await this.executeSinglePipelineStage(context, stage);
      context = this.attachPipelineTotalLatency(context, pipelineStartMs);
    }

    return context;
  }

  private initializePipelineContext(context: PipelineContext): PipelineContext {
    return {
      ...context,
      pipelineStartedAtMs: context.pipelineStartedAtMs ?? this.readCurrentTimestampMs(),
      warnings: context.warnings ?? [],
      executedStages: context.executedStages ?? [],
      stageLatenciesMs: context.stageLatenciesMs ?? {},
      meta: context.meta ?? {},
    };
  }

  private async executeSinglePipelineStage(
    context: PipelineContext,
    stage: PipelineStage,
  ): Promise<PipelineContext> {
    const stageStartMs = this.readCurrentTimestampMs();

    try {
      const stageContext = await stage.executeStage(context);
      return this.attachStageExecutionMetrics(stageContext, stage.name, stageStartMs);
    } catch (error) {
      this.logPipelineStageFailure(context, stage.name, stageStartMs, error);
      throw error;
    }
  }

  private attachStageExecutionMetrics(
    context: PipelineContext,
    stageName: string,
    stageStartMs: number,
  ): PipelineContext {
    const stageLatencyMs = this.calculateElapsedMilliseconds(stageStartMs);

    return {
      ...context,
      executedStages: [...context.executedStages, stageName],
      stageLatenciesMs: {
        ...context.stageLatenciesMs,
        [stageName]: stageLatencyMs,
      },
    };
  }

  private attachPipelineTotalLatency(
    context: PipelineContext,
    pipelineStartMs: number,
  ): PipelineContext {
    return {
      ...context,
      meta: {
        ...context.meta,
        latencyMs: this.calculateElapsedMilliseconds(pipelineStartMs),
      },
    };
  }

  private readCurrentTimestampMs(): number {
    return Date.now();
  }

  private calculateElapsedMilliseconds(startTimestampMs: number): number {
    const elapsedMilliseconds = this.readCurrentTimestampMs() - startTimestampMs;
    return elapsedMilliseconds > 0 ? elapsedMilliseconds : 0;
  }

  private logPipelineStageFailure(
    context: PipelineContext,
    stageName: string,
    stageStartMs: number,
    error: unknown,
  ): void {
    console.error(
      '[IngestionPipeline] stage failed',
      JSON.stringify(
        {
          userId: context.userId,
          uploadId: context.uploadId,
          stage: stageName,
          stageLatencyMs: this.calculateElapsedMilliseconds(stageStartMs),
          error: this.readErrorMessage(error),
        },
        null,
        2,
      ),
    );
  }

  private readErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'unknown error';
  }
}
