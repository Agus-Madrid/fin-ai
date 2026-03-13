import type { ExtractedTransaction } from '../../../../../core/ai/interfaces';
import type { CategoryCreationSuggestion } from './category-creation-suggestion.interface';

export interface CategoryResolutionAggregate {
  transactions: ExtractedTransaction[];
  warnings: string[];
  categoryCreationSuggestions: CategoryCreationSuggestion[];
}
