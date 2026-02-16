export interface ExtractStatementInput {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category?: string;
  confidence?: number;
}

export interface ExtractStatementResult {
  transactions: ExtractedTransaction[];
  warnings: string[];
}
