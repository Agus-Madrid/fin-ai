import { Inject, Injectable } from '@nestjs/common';
import { AI_CLIENT } from './ai.client';
import type { AiClient } from './ai.client';
import { ExtractStatementInput, ExtractStatementResult } from './ai.types';

@Injectable()
export class AiService {
  constructor(@Inject(AI_CLIENT) private readonly client: AiClient) {}

  async extractStatement(
    input: ExtractStatementInput,
  ): Promise<ExtractStatementResult> {
    return this.client.extractStatement(input);
  }
}
