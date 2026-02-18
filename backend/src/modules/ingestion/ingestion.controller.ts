import { Controller, Post } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('statement/preview')
  async previewExtraction() {
    return {
      message: 'Endpoint placeholder. Wire file upload + AI extraction here.',
    };
  }
}
