import { Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('uploads/:uploadId/process')
  processUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('uploadId') uploadId: string,
  ) {
    return this.ingestionService.processUploadWithPipeline(
      user.userId,
      uploadId,
    );
  }
}
