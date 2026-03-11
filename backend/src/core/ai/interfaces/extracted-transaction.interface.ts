export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category?: string;
  confidence?: number;
}
