import { Module } from '@nestjs/common';
import { ReviewInboxController } from './review-inbox.controller';
import { ReviewInboxService } from './review-inbox.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [ReviewInboxController],
  providers: [ReviewInboxService],
})
export class ReviewInboxModule {}
