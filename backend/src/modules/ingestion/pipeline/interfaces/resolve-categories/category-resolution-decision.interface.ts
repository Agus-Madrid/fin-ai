export interface CategoryResolutionDecision {
  selectedCategoryId: string | null;
  selectedCategoryName?: string;
  confidence: number | null;
  needsCategoryCreation: boolean;
  suggestedCategoryName?: string;
}
