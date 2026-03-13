import {
  CheckCategoryMatchInput,
  CheckCategoryMatchResult,
  ExtractStatementInput,
  ExtractStatementResult,
  ExtractTransactionsFromTextInput,
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
}

export const AI_CLIENT = Symbol('AI_CLIENT');
