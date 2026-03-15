import { Inject, Injectable } from '@nestjs/common';
import { AI_CLIENT } from './ai.client';
import type { AiClient } from './ai.client';
import {
  CheckCategoryMatchInput,
  CheckCategoryMatchResult,
  ExtractStatementInput,
  ExtractStatementResult,
  ExtractTransactionsFromTextInput,
  GenerateCategoryVisualsInput,
  GenerateCategoryVisualsResult,
} from './interfaces';

@Injectable()
export class AiService {
  constructor(@Inject(AI_CLIENT) private readonly client: AiClient) {}

  async extractStatement(
    input: ExtractStatementInput,
  ): Promise<ExtractStatementResult> {
    return this.client.extractStatement(input);
  }

  async extractTransactionsFromText(
    input: ExtractTransactionsFromTextInput,
  ): Promise<ExtractStatementResult> {
    return this.client.extractTransactionsFromText(input);
  }

  async checkCategoryMatch(
    input: CheckCategoryMatchInput,
  ): Promise<CheckCategoryMatchResult> {
    return this.client.checkCategoryMatch(input);
  }

  async generateCategoryVisuals(
    input: GenerateCategoryVisualsInput,
  ): Promise<GenerateCategoryVisualsResult> {
    return this.client.generateCategoryVisuals(input);
  }
}
