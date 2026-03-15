import { CategoryVisualSuggestion } from './category-visual-suggestion.interface';

export interface GenerateCategoryVisualsResult {
  visuals: CategoryVisualSuggestion[];
  warnings: string[];
}
