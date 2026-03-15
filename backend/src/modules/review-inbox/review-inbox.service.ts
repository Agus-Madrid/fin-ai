import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/transaction.enum';
import { ReviewTransactionDto } from './dtos/review-transaction.dto';

@Injectable()
export class ReviewInboxService {
  constructor(private readonly transactionsService: TransactionsService) {}

  listPending(userId: string) {
    return this.transactionsService.findAllByUserStatus(
      userId,
      TransactionStatus.PENDING,
    );
  }

  confirmTransaction(userId: string, id: number, update: ReviewTransactionDto) {
    return this.transactionsService.confirmWithUpdates(userId, id, update);
  }

  confirmMany(userId: string, ids: number[]) {
    return this.transactionsService.confirmMany(userId, ids);
  }
}
