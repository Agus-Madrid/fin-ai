export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  dateLabel: string;
  merchant: string;
  category: string;
  method: string;
  amount: number;
  currency: string;
  type: TransactionType;
  note?: string;
  status?: string;
  icon?: string;
}
