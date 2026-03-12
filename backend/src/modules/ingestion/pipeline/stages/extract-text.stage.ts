import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class ExtractTextStage implements PipelineStage {
  readonly name = 'extract-text';

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    if (!context.fileBuffer) {
      throw new InternalServerErrorException(
        'Cannot extract text without upload file buffer',
      );
    }

    const extractedText = this.extractTextFromPdfBuffer(context.fileBuffer);
    const warnings = [...context.warnings];

    if (!extractedText.trim()) {
      warnings.push('No text could be extracted from PDF with current extractor.');
    }

    return {
      ...context,
      extractedText,
      warnings,
    };
  }

  private extractTextFromPdfBuffer(buffer: Buffer): string {
    const rawPdfText = buffer.toString('latin1');
    const fragments: string[] = [];

    const textOperatorPattern = /\((?:\\.|[^\\()])*\)\s*Tj/g;
    for (const match of rawPdfText.matchAll(textOperatorPattern)) {
      const literalMatch = match[0].match(/\((?:\\.|[^\\()])*\)/);
      if (!literalMatch) {
        continue;
      }

      const decoded = this.decodePdfLiteralString(literalMatch[0]);
      if (decoded) {
        fragments.push(decoded);
      }
    }

    const textArrayPattern = /\[(.*?)\]\s*TJ/gs;
    for (const match of rawPdfText.matchAll(textArrayPattern)) {
      const arrayBody = match[1] ?? '';
      const literals = arrayBody.match(/\((?:\\.|[^\\()])*\)/g) ?? [];
      for (const literal of literals) {
        const decoded = this.decodePdfLiteralString(literal);
        if (decoded) {
          fragments.push(decoded);
        }
      }
    }

    return fragments
      .join('\n')
      .replaceAll('\r', '\n')
      .replaceAll(/\n{3,}/g, '\n\n')
      .trim();
  }

  private decodePdfLiteralString(literal: string): string {
    const withoutBrackets = literal.slice(1, -1);
    return withoutBrackets
      .replaceAll(String.raw`\(`, '(')
      .replaceAll(String.raw`\)`, ')')
      .replaceAll('\\\\', '\\')
      .replaceAll(String.raw`\n`, '\n')
      .replaceAll(String.raw`\r`, '\n')
      .replaceAll(String.raw`\t`, '\t')
      .replaceAll(String.raw`\b`, '\b')
      .replaceAll(String.raw`\f`, '\f')
      .trim();
  }
}
