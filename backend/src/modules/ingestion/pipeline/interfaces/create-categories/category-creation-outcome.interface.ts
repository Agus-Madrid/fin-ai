import type { CategoryReference } from './category-reference.interface';

export interface CategoryCreationOutcome {
  categoryLookup: Map<string, CategoryReference>;
  createdCategories: CategoryReference[];
  warnings: string[];
}
