import { TransactionStatus } from "../transaction.enum";

export class CreateTransactionDto {
    amount: number;
    date: Date;
    description: string;
    status: TransactionStatus;
    categoryId: string;
    userId: string; 
}