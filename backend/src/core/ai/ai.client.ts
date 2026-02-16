import { ExtractStatementInput, ExtractStatementResult } from './ai.types';

export interface AiClient {
  extractStatement(input: ExtractStatementInput): Promise<ExtractStatementResult>;
}

export const AI_CLIENT = Symbol('AI_CLIENT');
