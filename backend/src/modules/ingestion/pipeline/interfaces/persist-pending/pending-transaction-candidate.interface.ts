export interface PendingTransactionCandidate {
  sourceIndex: number;
  ingestionKey: string;
  date: string;
  amount: number;
  description: string;
  categoryId?: string;
}
