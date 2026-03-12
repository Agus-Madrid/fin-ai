import { Injectable } from '@nestjs/common';
import { PipelineContext } from './pipeline-context.interface';
import { PipelineStage } from './pipeline-stage.interface';
import { ExtractTextStage } from './stages/extract-text.stage';
import { LoadUploadStage } from './stages/load-upload.stage';
import { OcrFallbackStage } from './stages/ocr-fallback.stage';

@Injectable()
export class PipelineOrchestratorService {
  private readonly pipelineStages: PipelineStage[];

  constructor(
    private readonly loadUploadStage: LoadUploadStage,
    private readonly extractTextStage: ExtractTextStage,
    private readonly ocrFallbackStage: OcrFallbackStage,
  ) {
    this.pipelineStages = [loadUploadStage, extractTextStage, ocrFallbackStage];
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
