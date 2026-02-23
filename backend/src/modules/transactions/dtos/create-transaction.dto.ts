import { TransactionStatus } from '../transaction.enum';

export class CreateTransactionDto {
  amount: number;
  date: Date | string;
  description: string;
  status: TransactionStatus;
  categoryId: string;
  userId: string;
}
