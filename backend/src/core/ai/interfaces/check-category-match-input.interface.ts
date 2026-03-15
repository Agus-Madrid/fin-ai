import { CategoryCandidate } from './category-candidate.interface';

export interface CheckCategoryMatchInput {
  transaction: {
    date: string;
    merchant: string;
    amount: number;
    currency: string;
    category?: string;
    description?: string;
  };
  candidates: CategoryCandidate[];
}
