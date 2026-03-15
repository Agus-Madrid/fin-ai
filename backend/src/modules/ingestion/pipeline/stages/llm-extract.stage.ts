import { Injectable } from '@nestjs/common';
import { AiService } from '../../../../core/ai/ai.service';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class LlmExtractStage implements PipelineStage {
  readonly name = 'llm-extract';

  constructor(private readonly aiService: AiService) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const extractedText = context.extractedText?.trim() ?? '';
    if (!extractedText) {
      console.log(
        '[LlmExtractStage] skipped',
        JSON.stringify(
          {
            uploadId: context.uploadId,
            filename: context.upload?.filename ?? 'unknown',
            reason: 'no extracted text',
            textSource: context.meta.textSource ?? 'none',
            warnings: context.warnings,
          },
          null,
          2,
        ),
      );
      return {
        ...context,
        extractedTransactions: [],
        warnings: [
          ...context.warnings,
          'LLM extraction skipped because there is no extracted text.',
        ],
      };
    }

    const extraction = await this.aiService.extractTransactionsFromText({
      text: extractedText,
      filename: context.upload?.filename,
    });
    this.logModelUnderstanding(context, extraction);

    return {
      ...context,
      extractedTransactions: extraction.transactions,
      warnings: [...context.warnings, ...extraction.warnings],
      meta: {
        ...context.meta,
        model: process.env.GEMINI_MODEL?.trim() || context.meta.model,
        promptVersion: context.meta.promptVersion ?? 'llm-extract-v1',
      },
    };
  }

  private logModelUnderstanding(
    context: PipelineContext,
    extraction: {
      transactions: unknown[];
      warnings: string[];
    },
  ): void {
    console.log(
      '[LlmExtractStage] model understanding',
      JSON.stringify(
        {
          uploadId: context.uploadId,
          filename: context.upload?.filename ?? 'unknown',
          extractedCount: extraction.transactions.length,
          transactions: extraction.transactions,
          warnings: extraction.warnings,
        },
        null,
        2,
      ),
    );
  }
}
