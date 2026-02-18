import { Module } from '@nestjs/common';
import { ReviewInboxController } from './review-inbox.controller';
import { ReviewInboxService } from './review-inbox.service';

@Module({
  controllers: [ReviewInboxController],
  providers: [ReviewInboxService],
})
export class ReviewInboxModule {}
