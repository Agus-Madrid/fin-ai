import { Injectable } from '@nestjs/common';
import { AiClient } from './ai.client';
import { ExtractStatementInput, ExtractStatementResult } from './ai.types';

@Injectable()
export class NullAiClient implements AiClient {
  async extractStatement(
    _input: ExtractStatementInput,
  ): Promise<ExtractStatementResult> {
    return {
      transactions: [],
      warnings: ['AI client not configured.'],
    };
  }
}
