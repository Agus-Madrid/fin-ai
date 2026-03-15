import { Injectable } from '@nestjs/common';
import { AiClient } from './ai.client';
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

  extractTransactionsFromText(
    input: ExtractTransactionsFromTextInput,
  ): Promise<ExtractStatementResult> {
    void input;
    return Promise.resolve({
      transactions: [],
      warnings: ['AI client not configured.'],
    });
  }

  checkCategoryMatch(
    input: CheckCategoryMatchInput,
  ): Promise<CheckCategoryMatchResult> {
    void input;
    return Promise.resolve({
      selectedCategoryId: null,
      confidence: 0,
      shouldCreateCategory: false,
      warnings: ['AI client not configured.'],
    });
  }

  generateCategoryVisuals(
    input: GenerateCategoryVisualsInput,
  ): Promise<GenerateCategoryVisualsResult> {
    void input;
    return Promise.resolve({
      visuals: [],
      warnings: ['AI client not configured.'],
    });
  }
}
