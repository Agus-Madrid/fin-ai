import { Injectable } from '@nestjs/common';
import { UploadsService } from '../../../uploads/uploads.service';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class LoadUploadStage implements PipelineStage {
  readonly name = 'load-upload';

  constructor(private readonly uploadsService: UploadsService) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    return this.loadUploadedFileFromStorage(context);
  }

  private async loadUploadedFileFromStorage(
    context: PipelineContext,
  ): Promise<PipelineContext> {
    const file = await this.uploadsService.getUploadFile(
      context.userId,
      context.uploadId,
    );

    return {
      ...context,
      upload: {
        filename: file.filename,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
      },
      fileBuffer: file.body,
    };
  }
}
