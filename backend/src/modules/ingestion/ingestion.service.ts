import { Injectable } from '@nestjs/common';
import { AiService } from '../../core/ai/ai.service';
import { ExtractStatementInput, ExtractStatementResult } from '../../core/ai/ai.types';

@Injectable()
export class IngestionService {
  constructor(private readonly aiService: AiService) {}

  async extractStatement(input: ExtractStatementInput): Promise<ExtractStatementResult> {
    return this.aiService.extractStatement(input);
  }
}
