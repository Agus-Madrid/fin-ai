import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExtractedTransaction } from '../../../../core/ai/interfaces';
import { Category } from '../../../categories/category.entity';
import { Transaction } from '../../../transactions/transaction.entity';
import { TransactionStatus } from '../../../transactions/transaction.enum';
import { User } from '../../../user/user.entity';
import {
  PendingTransactionCandidate,
  PendingTransactionWritePlan,
  PersistPendingContextSummary,
  PersistPendingStageResult,
} from '../interfaces/persist-pending';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class PersistPendingTransactionsStage implements PipelineStage {
  readonly name = 'persist-pending-transactions';
  private readonly fallbackAmount = 0.01;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = this.readTransactionsFromContext(context);
    if (transactions.length === 0) {
      return this.buildContextWithoutTransactions(context);
    }

    const contextSummary = this.buildContextSummary(context);
    const writePlan = this.buildPendingTransactionWritePlan(context, transactions);
    const existingIngestionKeys = await this.loadExistingIngestionKeys(
      writePlan.candidates,
    );
    const candidatesToPersist = this.filterCandidatesToPersist(
      writePlan.candidates,
      existingIngestionKeys,
    );
    const categoryLookup = await this.loadCategoryLookup(
      context.userId,
      candidatesToPersist,
    );
    const stageResult = await this.persistPendingTransactions(
      context,
      writePlan,
      existingIngestionKeys,
      candidatesToPersist,
      categoryLookup,
    );

    this.logPersistenceResult(contextSummary, stageResult);
    return this.buildContextWithPersistenceResult(context, stageResult);
  }

  private readTransactionsFromContext(
    context: PipelineContext,
  ): ExtractedTransaction[] {
    return context.extractedTransactions ?? [];
  }

  private buildContextWithoutTransactions(
    context: PipelineContext,
  ): PipelineContext {
    return {
      ...context,
      persistedPendingTransactionsCount: 0,
      skippedPendingTransactionsCount: 0,
      warnings: [
        ...context.warnings,
        'PersistPendingTransactionsStage: no transactions available for persistence.',
      ],
    };
  }

  private buildContextSummary(
    context: PipelineContext,
  ): PersistPendingContextSummary {
    return {
      userId: context.userId,
      uploadId: context.uploadId,
    };
  }

  private buildPendingTransactionWritePlan(
    context: PipelineContext,
    transactions: ExtractedTransaction[],
  ): PendingTransactionWritePlan {
    const warnings: string[] = [];
    const signatureOccurrenceMap = new Map<string, number>();
    const candidates = transactions.map((transaction, index) =>
      this.buildPendingTransactionCandidate(
        context,
        transaction,
        index,
        signatureOccurrenceMap,
        warnings,
      ),
    );

    return {
      candidates,
      warnings,
    };
  }

  private buildPendingTransactionCandidate(
    context: PipelineContext,
    transaction: ExtractedTransaction,
    sourceIndex: number,
    signatureOccurrenceMap: Map<string, number>,
    warnings: string[],
  ): PendingTransactionCandidate {
    const date = this.normalizeDateForPersistence(transaction.date, sourceIndex, warnings);
    const amount = this.normalizeAmountForPersistence(
      transaction.amount,
      sourceIndex,
      warnings,
    );
    const description = this.normalizeDescriptionForPersistence(
      transaction.description,
      transaction.merchant,
    );
    const categoryId = this.normalizeCategoryIdForPersistence(transaction.categoryId);
    const signature = this.buildTransactionSignature(transaction);
    const occurrence = this.incrementSignatureOccurrence(
      signatureOccurrenceMap,
      signature,
    );
    const ingestionKey = this.buildIngestionKey(
      context.userId,
      context.uploadId,
      signature,
      occurrence,
    );

    return {
      sourceIndex,
      ingestionKey,
      date,
      amount,
      description,
      categoryId,
    };
  }

  private normalizeDateForPersistence(
    rawDate: string,
    sourceIndex: number,
    warnings: string[],
  ): string {
    if (this.isValidIsoDate(rawDate)) {
      return rawDate;
    }

    const fallbackDate = new Date().toISOString().slice(0, 10);
    warnings.push(
      `PersistPendingTransactionsStage[index=${sourceIndex}]: invalid date "${rawDate}". Using fallback date "${fallbackDate}".`,
    );
    return fallbackDate;
  }

  private normalizeAmountForPersistence(
    rawAmount: number,
    sourceIndex: number,
    warnings: string[],
  ): number {
    if (Number.isFinite(rawAmount) && rawAmount > 0) {
      return this.roundToTwoDecimals(rawAmount);
    }

    warnings.push(
      `PersistPendingTransactionsStage[index=${sourceIndex}]: invalid amount "${rawAmount}". Using fallback amount "${this.fallbackAmount}".`,
    );
    return this.fallbackAmount;
  }

  private normalizeDescriptionForPersistence(
    description: string | undefined,
    merchant: string,
  ): string {
    const normalizedDescription = description?.trim();
    if (normalizedDescription) {
      return normalizedDescription;
    }

    const normalizedMerchant = merchant.trim();
    if (normalizedMerchant) {
      return normalizedMerchant;
    }

    return '(Issue)';
  }

  private normalizeCategoryIdForPersistence(
    categoryId: string | undefined,
  ): string | undefined {
    const normalizedCategoryId = categoryId?.trim();
    if (!normalizedCategoryId) {
      return undefined;
    }

    return normalizedCategoryId;
  }

  private buildTransactionSignature(transaction: ExtractedTransaction): string {
    const payload = {
      date: this.normalizeComparableText(transaction.date),
      merchant: this.normalizeComparableText(transaction.merchant),
      amount: this.normalizeComparableAmount(transaction.amount),
      currency: this.normalizeComparableText(transaction.currency),
      description: this.normalizeComparableText(transaction.description),
      categoryId: this.normalizeComparableText(transaction.categoryId),
      category: this.normalizeComparableText(transaction.category),
    };

    return this.hashText(JSON.stringify(payload));
  }

  private normalizeComparableAmount(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return this.roundToTwoDecimals(value);
  }

  private normalizeComparableText(value: string | undefined): string {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.toLowerCase();
  }

  private incrementSignatureOccurrence(
    signatureOccurrenceMap: Map<string, number>,
    signature: string,
  ): number {
    const nextOccurrence = (signatureOccurrenceMap.get(signature) ?? 0) + 1;
    signatureOccurrenceMap.set(signature, nextOccurrence);
    return nextOccurrence;
  }

  private buildIngestionKey(
    userId: string,
    uploadId: string,
    signature: string,
    occurrence: number,
  ): string {
    return this.hashText(`${userId}|${uploadId}|${signature}|${occurrence}`);
  }

  private hashText(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private async loadExistingIngestionKeys(
    candidates: PendingTransactionCandidate[],
  ): Promise<Set<string>> {
    const ingestionKeys = candidates.map((candidate) => candidate.ingestionKey);
    if (ingestionKeys.length === 0) {
      return new Set<string>();
    }

    const rows = await this.transactionRepository.find({
      where: { ingestionKey: In(ingestionKeys) },
      select: ['ingestionKey'],
    });

    return new Set(
      rows
        .map((row) => row.ingestionKey)
        .filter((ingestionKey): ingestionKey is string => !!ingestionKey),
    );
  }

  private filterCandidatesToPersist(
    candidates: PendingTransactionCandidate[],
    existingIngestionKeys: Set<string>,
  ): PendingTransactionCandidate[] {
    return candidates.filter(
      (candidate) => !existingIngestionKeys.has(candidate.ingestionKey),
    );
  }

  private async loadCategoryLookup(
    userId: string,
    candidatesToPersist: PendingTransactionCandidate[],
  ): Promise<Map<string, Category>> {
    const categoryIds = this.collectCategoryIdsFromCandidates(candidatesToPersist);
    if (categoryIds.length === 0) {
      return new Map<string, Category>();
    }

    const categories = await this.categoryRepository.find({
      where: {
        id: In(categoryIds),
        userId,
      },
    });

    return this.buildCategoryLookup(categories);
  }

  private collectCategoryIdsFromCandidates(
    candidates: PendingTransactionCandidate[],
  ): string[] {
    return [...new Set(candidates.map((candidate) => candidate.categoryId).filter(
      (categoryId): categoryId is string => !!categoryId,
    ))];
  }

  private buildCategoryLookup(categories: Category[]): Map<string, Category> {
    const lookup = new Map<string, Category>();
    categories.forEach((category) => {
      lookup.set(category.id, category);
    });
    return lookup;
  }

  private async persistPendingTransactions(
    context: PipelineContext,
    writePlan: PendingTransactionWritePlan,
    existingIngestionKeys: Set<string>,
    candidatesToPersist: PendingTransactionCandidate[],
    categoryLookup: Map<string, Category>,
  ): Promise<PersistPendingStageResult> {
    const warnings = [...writePlan.warnings];
    let persistedCount = 0;

    for (const candidate of candidatesToPersist) {
      const wasPersisted = await this.persistSinglePendingTransaction(
        context,
        candidate,
        categoryLookup,
        warnings,
      );

      if (wasPersisted) {
        persistedCount += 1;
      }
    }

    return {
      persistedCount,
      skippedCount: existingIngestionKeys.size,
      warnings,
    };
  }

  private async persistSinglePendingTransaction(
    context: PipelineContext,
    candidate: PendingTransactionCandidate,
    categoryLookup: Map<string, Category>,
    warnings: string[],
  ): Promise<boolean> {
    try {
      const category = this.resolveCategoryForCandidate(
        candidate,
        categoryLookup,
        warnings,
      );
      const transactionEntity = this.buildPendingTransactionEntity(
        context,
        candidate,
        category,
      );
      await this.transactionRepository.save(transactionEntity);
      return true;
    } catch (error) {
      warnings.push(
        this.buildPersistenceFailureWarning(candidate.sourceIndex, error),
      );
      return false;
    }
  }

  private resolveCategoryForCandidate(
    candidate: PendingTransactionCandidate,
    categoryLookup: Map<string, Category>,
    warnings: string[],
  ): Category | null {
    if (!candidate.categoryId) {
      return null;
    }

    const category = categoryLookup.get(candidate.categoryId);
    if (category) {
      return category;
    }

    warnings.push(
      `PersistPendingTransactionsStage[index=${candidate.sourceIndex}]: category "${candidate.categoryId}" not found for user. Category removed from persisted transaction.`,
    );
    return null;
  }

  private buildPendingTransactionEntity(
    context: PipelineContext,
    candidate: PendingTransactionCandidate,
    category: Category | null,
  ): Transaction {
    return this.transactionRepository.create({
      amount: candidate.amount,
      description: candidate.description,
      date: candidate.date,
      status: TransactionStatus.PENDING,
      user: { id: context.userId } as User,
      category,
      sourceUploadId: context.uploadId,
      ingestionKey: candidate.ingestionKey,
    });
  }

  private buildPersistenceFailureWarning(
    sourceIndex: number,
    error: unknown,
  ): string {
    const rawMessage = error instanceof Error ? error.message : 'unknown error';
    const normalizedMessage = rawMessage.trim().slice(0, 220);
    return `PersistPendingTransactionsStage[index=${sourceIndex}]: failed to persist transaction. Reason: ${normalizedMessage || 'unknown error'}.`;
  }

  private logPersistenceResult(
    contextSummary: PersistPendingContextSummary,
    result: PersistPendingStageResult,
  ): void {
    console.log(
      '[PersistPendingTransactionsStage] persistence result',
      JSON.stringify(
        {
          uploadId: contextSummary.uploadId,
          userId: contextSummary.userId,
          persistedCount: result.persistedCount,
          skippedCount: result.skippedCount,
          warningCount: result.warnings.length,
        },
        null,
        2,
      ),
    );
  }

  private buildContextWithPersistenceResult(
    context: PipelineContext,
    result: PersistPendingStageResult,
  ): PipelineContext {
    return {
      ...context,
      persistedPendingTransactionsCount: result.persistedCount,
      skippedPendingTransactionsCount: result.skippedCount,
      warnings: [...context.warnings, ...result.warnings],
    };
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }

  private roundToTwoDecimals(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
