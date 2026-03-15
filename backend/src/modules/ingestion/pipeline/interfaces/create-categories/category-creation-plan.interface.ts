import type { CategoryCreationRequest } from './category-creation-request.interface';

export interface CategoryCreationPlan {
  requests: CategoryCreationRequest[];
  warnings: string[];
}
