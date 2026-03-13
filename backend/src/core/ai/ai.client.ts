import {
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
}

export const AI_CLIENT = Symbol('AI_CLIENT');
