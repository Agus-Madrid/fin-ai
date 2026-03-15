import { ExtractTextFromPdfInput } from './extract-text-from-pdf-input.interface';
import { ExtractTextFromPdfResult } from './extract-text-from-pdf-result.interface';

export interface DocumentOcrService {
  readonly providerName: string;
  extractTextFromPdf(
    input: ExtractTextFromPdfInput,
  ): Promise<ExtractTextFromPdfResult>;
}
