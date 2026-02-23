import { TransactionStatus } from "../enum/transaction-status.enum";

export interface CreateTransactionRequest {
  amount: number;
  date: string | Date;
  description: string;
  categoryId: string;
}

export interface CreateTransactionDto extends CreateTransactionRequest {
  status: TransactionStatus;
  userId: string;
}
