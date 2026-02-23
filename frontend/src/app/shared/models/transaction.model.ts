import { TransactionStatus } from "../enum/transaction-status.enum";
import { Category } from "./category.model";

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  status: TransactionStatus;
  category: Category;
}
