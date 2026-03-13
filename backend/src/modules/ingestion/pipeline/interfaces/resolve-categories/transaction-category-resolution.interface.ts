import type { ExtractedTransaction } from '../../../../../core/ai/interfaces';
import type { CategoryCreationSuggestion } from './category-creation-suggestion.interface';

export interface TransactionCategoryResolution {
  transaction: ExtractedTransaction;
  warnings: string[];
  categoryCreationSuggestion?: CategoryCreationSuggestion;
}
