import type { CheckCategoryMatchResult } from '../../../../../core/ai/interfaces';
import type { CategoryResolutionDecision } from './category-resolution-decision.interface';
import type { DeterministicCategoryMatch } from './deterministic-category-match.interface';

export interface CategoryResolutionCheckInput {
  transactionIndex: number;
  deterministicMatch: DeterministicCategoryMatch;
  llmMatch: CheckCategoryMatchResult;
  decision: CategoryResolutionDecision;
}
