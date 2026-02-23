import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { ReviewTransactionDto } from './dtos/review-transaction.dto';

@Injectable()
export class ReviewInboxService {
  constructor(private readonly transactionsService: TransactionsService) {}

  listPending() {
    return [];
  }

  confirmTransaction(id: number, update: ReviewTransactionDto) {
    return this.transactionsService.confirmWithUpdates(id, update);
  }
}
