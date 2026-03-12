import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { PipelineOrchestratorService } from './pipeline/pipeline-orchestrator.service';
import { ExtractTextStage } from './pipeline/stages/extract-text.stage';
import { LoadUploadStage } from './pipeline/stages/load-upload.stage';

@Module({
  imports: [UploadsModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    PipelineOrchestratorService,
    LoadUploadStage,
    ExtractTextStage,
  ],
})
export class IngestionModule {}
