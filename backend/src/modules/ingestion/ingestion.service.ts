import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProcessUploadResponseDto } from './dtos/process-upload-response.dto';
import { PipelineOrchestratorService } from './pipeline/pipeline-orchestrator.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class IngestionService {
  constructor(
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly uploadsService: UploadsService,
  ) {}

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
        stageLatenciesMs: {},
        meta: {},
      });

    if (!context.upload) {
      throw new InternalServerErrorException(
        'Pipeline completed without upload metadata',
      );
    }
    await this.uploadsService.markUploadAsCompleted(userId, uploadId);

    return {
      uploadId: context.uploadId,
      status: 'PENDING_PERSISTED',
      extractedTextLength: context.extractedText?.length ?? 0,
      textSource: context.meta.textSource ?? 'none',
      filename: context.upload.filename,
      contentType: context.upload.contentType,
      sizeBytes: context.upload.sizeBytes,
      persistedPendingTransactionsCount:
        context.persistedPendingTransactionsCount ?? 0,
      skippedPendingTransactionsCount: context.skippedPendingTransactionsCount ?? 0,
      warnings: context.warnings,
      executedStages: context.executedStages,
    };
  }
}
