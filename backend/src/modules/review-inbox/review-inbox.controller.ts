import { Controller, Get } from '@nestjs/common';
import { ReviewInboxService } from './review-inbox.service';

@Controller('review-inbox')
export class ReviewInboxController {
  constructor(private readonly reviewInboxService: ReviewInboxService) {}

  @Get()
  listPending() {
    return this.reviewInboxService.listPending();
  }
}
