import { Injectable } from '@nestjs/common';
import { AiClient } from './ai.client';
import { ExtractStatementInput, ExtractStatementResult } from './ai.types';

@Injectable()
export class NullAiClient implements AiClient {
  extractStatement(
    input: ExtractStatementInput,
  ): Promise<ExtractStatementResult> {
    void input;
    return Promise.resolve({
      transactions: [],
      warnings: ['AI client not configured.'],
    });
  }
}
