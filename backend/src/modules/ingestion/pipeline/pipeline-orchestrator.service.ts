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
    ];
  }

  async executeUploadIngestionPipeline(
    initialContext: PipelineContext,
  ): Promise<PipelineContext> {
    let context = this.initializePipelineContext(initialContext);

    for (const stage of this.pipelineStages) {
      context = await stage.executeStage(context);
      context = {
        ...context,
        executedStages: [...context.executedStages, stage.name],
      };
    }

    return context;
  }

  private initializePipelineContext(context: PipelineContext): PipelineContext {
    return {
      ...context,
      warnings: context.warnings ?? [],
      executedStages: context.executedStages ?? [],
      meta: context.meta ?? {},
    };
  }
}
