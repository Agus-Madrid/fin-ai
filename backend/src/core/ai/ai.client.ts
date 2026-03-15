import {
  CheckCategoryMatchInput,
  CheckCategoryMatchResult,
  ExtractStatementInput,
  ExtractStatementResult,
  ExtractTransactionsFromTextInput,
  GenerateCategoryVisualsInput,
  GenerateCategoryVisualsResult,
} from './interfaces';

export interface AiClient {
  extractStatement(
    input: ExtractStatementInput,
  ): Promise<ExtractStatementResult>;
  extractTransactionsFromText(
    input: ExtractTransactionsFromTextInput,
  ): Promise<ExtractStatementResult>;
  checkCategoryMatch(
    input: CheckCategoryMatchInput,
  ): Promise<CheckCategoryMatchResult>;
  generateCategoryVisuals(
    input: GenerateCategoryVisualsInput,
  ): Promise<GenerateCategoryVisualsResult>;
}

export const AI_CLIENT = Symbol('AI_CLIENT');
