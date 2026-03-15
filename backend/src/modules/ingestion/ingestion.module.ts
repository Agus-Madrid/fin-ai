import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '../uploads/uploads.module';
import { CategoryModule } from '../categories/category.module';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { DOCUMENT_OCR_SERVICE } from './ocr/ocr.constants';
import type { DocumentOcrService } from './ocr/interfaces/document-ocr-service.interface';
import { NullDocumentOcrService } from './ocr/null-document-ocr.service';
import { TesseractCliDocumentOcrService } from './ocr/tesseract-cli-document-ocr.service';
import { PipelineOrchestratorService } from './pipeline/pipeline-orchestrator.service';
import { CreateCategoriesStage } from './pipeline/stages/create-categories.stage';
import { CurrencyExchangeStage } from './pipeline/stages/currency-exchange.stage';
import { ExtractTextStage } from './pipeline/stages/extract-text.stage';
import { IssueDescriptionStage } from './pipeline/stages/issue-description.stage';
import { LlmExtractStage } from './pipeline/stages/llm-extract.stage';
import { LoadUploadStage } from './pipeline/stages/load-upload.stage';
import { OcrFallbackStage } from './pipeline/stages/ocr-fallback.stage';
import { ResolveCategoriesStage } from './pipeline/stages/resolve-categories.stage';
import { AiModule } from '../../core/ai/ai.module';
import { ValidationNormalizationStage } from './pipeline/stages/validation-normalization.stage';
import { PersistPendingTransactionsStage } from './pipeline/stages/persist-pending-transactions.stage';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from '../categories/category.entity';
import { PipelineLoggingStage } from './pipeline/stages/pipeline-logging.stage';

function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

function createDocumentOcrService(): DocumentOcrService {
  const driver = (process.env.OCR_DRIVER ?? 'none').trim().toLowerCase();

  if (driver === 'none') {
    return new NullDocumentOcrService();
  }

  if (driver === 'tesseract-cli') {
    return new TesseractCliDocumentOcrService({
      tesseractBin: process.env.OCR_TESSERACT_BIN?.trim() || 'tesseract',
      pdftoppmBin: process.env.OCR_PDFTOPPM_BIN?.trim() || 'pdftoppm',
      language: process.env.OCR_LANGUAGE?.trim() || 'spa+eng',
      dpi: parsePositiveInt(process.env.OCR_DPI, 300),
    });
  }

  throw new Error(`Unsupported OCR driver "${driver}"`);
}

@Module({
  imports: [
    AiModule,
    UploadsModule,
    CategoryModule,
    TypeOrmModule.forFeature([Transaction, Category]),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    PipelineOrchestratorService,
    LoadUploadStage,
    ExtractTextStage,
    OcrFallbackStage,
    LlmExtractStage,
    ValidationNormalizationStage,
    ResolveCategoriesStage,
    CreateCategoriesStage,
    CurrencyExchangeStage,
    IssueDescriptionStage,
    PersistPendingTransactionsStage,
    PipelineLoggingStage,
    {
      provide: DOCUMENT_OCR_SERVICE,
      useFactory: createDocumentOcrService,
    },
  ],
})
export class IngestionModule {}
