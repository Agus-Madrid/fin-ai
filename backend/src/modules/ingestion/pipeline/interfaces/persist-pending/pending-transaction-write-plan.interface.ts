import type { PendingTransactionCandidate } from './pending-transaction-candidate.interface';

export interface PendingTransactionWritePlan {
  candidates: PendingTransactionCandidate[];
  warnings: string[];
}
