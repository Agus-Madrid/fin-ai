import { InjectionToken } from '@nestjs/common';
import { ExtractStatementInput, ExtractStatementResult } from './ai.types';

export interface AiClient {
  extractStatement(input: ExtractStatementInput): Promise<ExtractStatementResult>;
}

export const AI_CLIENT = new InjectionToken<AiClient>('AI_CLIENT');
