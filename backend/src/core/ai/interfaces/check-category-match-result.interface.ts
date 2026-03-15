export interface CheckCategoryMatchResult {
  selectedCategoryId: string | null;
  confidence: number;
  shouldCreateCategory: boolean;
  suggestedCategoryName?: string;
  reason?: string;
  warnings: string[];
}
