import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProcessUploadResponseDto } from './dtos/process-upload-response.dto';
import { PipelineOrchestratorService } from './pipeline/pipeline-orchestrator.service';

@Injectable()
export class IngestionService {
  constructor(private readonly pipelineOrchestrator: PipelineOrchestratorService) {}

  async processUploadWithPipeline(
    userId: string,
    uploadId: string,
  ): Promise<ProcessUploadResponseDto> {
    const context =
      await this.pipelineOrchestrator.executeUploadIngestionPipeline({
        userId,
        uploadId,
        warnings: [],
        executedStages: [],
        meta: {},
      });

    if (!context.upload) {
      throw new InternalServerErrorException(
        'Pipeline completed without upload metadata',
      );
    }

    return {
      uploadId: context.uploadId,
      status: 'LLM_EXTRACTED',
      extractedTextLength: context.extractedText?.length ?? 0,
      textSource: context.meta.textSource ?? 'none',
      filename: context.upload.filename,
      contentType: context.upload.contentType,
      sizeBytes: context.upload.sizeBytes,
      warnings: context.warnings,
      executedStages: context.executedStages,
    };
  }
}
