import type { ExtractedTransaction } from '../../../../../core/ai/interfaces';
import type { CategoryReference } from './category-reference.interface';

export interface CreateCategoriesStageResult {
  transactions: ExtractedTransaction[];
  warnings: string[];
  createdCategories: CategoryReference[];
  unresolvedTransactionIndexes: number[];
}
