export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  categoryId?: string;
  categoryMatchConfidence?: number;
  confidence?: number;
}
