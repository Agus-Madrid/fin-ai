import { ExtractedTransaction } from './extracted-transaction.interface';

export interface ExtractStatementResult {
  transactions: ExtractedTransaction[];
  warnings: string[];
}
