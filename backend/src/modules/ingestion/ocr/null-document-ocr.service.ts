import { Injectable } from '@nestjs/common';
import { DocumentOcrService } from './interfaces/document-ocr-service.interface';
import { ExtractTextFromPdfInput } from './interfaces/extract-text-from-pdf-input.interface';
import { ExtractTextFromPdfResult } from './interfaces/extract-text-from-pdf-result.interface';

@Injectable()
export class NullDocumentOcrService implements DocumentOcrService {
  readonly providerName = 'none';

  async extractTextFromPdf(
    input: ExtractTextFromPdfInput,
  ): Promise<ExtractTextFromPdfResult> {
    void input;
    return {
      text: '',
      warnings: [
        'OCR service is disabled. Configure OCR_DRIVER to enable fallback OCR.',
      ],
    };
  }
}
