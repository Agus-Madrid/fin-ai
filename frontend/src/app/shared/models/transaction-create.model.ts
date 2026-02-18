export enum TransactionStatus {
  PENDING = 0,
  CONFIRMED = 1,
  FAILED = 2
}

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
