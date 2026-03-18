import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DOCUMENT_OCR_SERVICE } from '../../ocr/ocr.constants';
import type { DocumentOcrService } from '../../ocr/interfaces/document-ocr-service.interface';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class OcrFallbackStage implements PipelineStage {
  readonly name = 'ocr-fallback';
  private readonly minTextLength = this.resolveMinTextLength();

  constructor(
    @Inject(DOCUMENT_OCR_SERVICE)
    private readonly documentOcrService: DocumentOcrService,
  ) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const currentText = context.extractedText ?? '';
    if (this.hasEnoughText(currentText)) {
      console.log(
        '[OcrFallbackStage] skipped',
        JSON.stringify(
          {
            uploadId: context.uploadId,
            reason: 'embedded text is sufficient',
            textLength: currentText.length,
          },
          null,
          2,
        ),
      );
      return context;
    }

    if (!context.fileBuffer) {
      throw new InternalServerErrorException(
        'Cannot execute OCR fallback without upload file buffer',
      );
    }

    const ocrResult = await this.documentOcrService.extractTextFromPdf({
      pdfBuffer: context.fileBuffer,
      filename: context.upload?.filename,
    });

    const ocrText = (ocrResult.text ?? '').trim();
    const warnings = [...context.warnings, ...ocrResult.warnings];

    if (!ocrText) {
      warnings.push('OCR fallback did not extract any text.');
      console.log(
        '[OcrFallbackStage] no text extracted',
        JSON.stringify(
          {
            uploadId: context.uploadId,
            provider: this.documentOcrService.providerName,
            warnings,
          },
          null,
          2,
        ),
      );
      return {
        ...context,
        warnings,
        meta: {
          ...context.meta,
          textSource: context.meta.textSource ?? 'none',
          ocrProvider: this.documentOcrService.providerName,
        },
      };
    }

    return {
      ...context,
      extractedText: ocrText,
      warnings,
      meta: {
        ...context.meta,
        textSource: 'ocr',
        ocrProvider: this.documentOcrService.providerName,
      },
    };
  }

  private hasEnoughText(text: string): boolean {
    const normalizedLength = text.replace(/\s+/g, '').length;
    return normalizedLength >= this.minTextLength;
  }

  private resolveMinTextLength(): number {
    const rawValue = process.env.OCR_MIN_TEXT_LENGTH?.trim();
    if (!rawValue) {
      return 80;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return 80;
    }

    return parsed;
  }
}
