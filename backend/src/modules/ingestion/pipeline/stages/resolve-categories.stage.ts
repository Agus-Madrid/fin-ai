import { Injectable } from '@nestjs/common';
import { CategoryService } from '../../../categories/category.service';
import { AiService } from '../../../../core/ai/ai.service';
import {
  CategoryCandidate,
  CheckCategoryMatchResult,
  ExtractedTransaction,
} from '../../../../core/ai/interfaces';
import {
  CategoryCandidateProfile,
  CategoryCreationSuggestion,
  CategoryResolutionAggregate,
  CategoryResolutionCheckInput,
  CategoryResolutionContextSummary,
  CategoryResolutionDecision,
  DeterministicCategoryMatch,
  RankedCategoryCandidate,
  TransactionCategoryResolution,
} from '../interfaces/resolve-categories';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class ResolveCategoriesStage implements PipelineStage {
  readonly name = 'resolve-categories';

  private readonly deterministicConfidenceThreshold = 0.45;
  private readonly llmConfidenceThreshold = 0.7;
  private readonly llmCandidateLimit = 5;
  private readonly comparableTokenAliases: Record<string, string> = {
    grocery: 'supermercado',
    groceries: 'supermercado',
    market: 'supermercado',
    supermarket: 'supermercado',
    super: 'supermercado',
    food: 'alimentos',
    restaurant: 'restaurante',
    restaurants: 'restaurante',
    transport: 'transporte',
    taxi: 'transporte',
    uber: 'transporte',
    fuel: 'combustible',
    gasoline: 'combustible',
    gasoil: 'combustible',
    internet: 'servicios',
    electricity: 'servicios',
    electric: 'servicios',
    water: 'servicios',
    phone: 'servicios',
    medical: 'salud',
    doctor: 'salud',
    pharmacy: 'salud',
    pharma: 'salud',
    entertainment: 'entretenimiento',
    subscription: 'suscripciones',
    subscriptions: 'suscripciones',
  };

  constructor(
    private readonly categoryService: CategoryService,
    private readonly aiService: AiService,
  ) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = this.readTransactionsFromContext(context);
    if (transactions.length === 0) {
      return context;
    }

    const userCategories = await this.loadUserCategories(context.userId);
    if (userCategories.length === 0) {
      return this.buildContextWithoutUserCategories(context);
    }

    const candidateProfiles =
      this.buildCategoryCandidateProfiles(userCategories);
    const resolution = await this.resolveCategoriesForTransactions(
      transactions,
      candidateProfiles,
    );
    this.logCategoryCreationSuggestions(
      this.buildResolutionContextSummary(context),
      resolution.categoryCreationSuggestions,
    );

    return this.buildContextWithCategoryResolution(context, resolution);
  }

  private readTransactionsFromContext(
    context: PipelineContext,
  ): ExtractedTransaction[] {
    return context.extractedTransactions ?? [];
  }

  private buildResolutionContextSummary(
    context: PipelineContext,
  ): CategoryResolutionContextSummary {
    return {
      uploadId: context.uploadId,
      userId: context.userId,
    };
  }

  private loadUserCategories(
    userId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    return this.categoryService.findAllByUser(userId);
  }

  private buildContextWithoutUserCategories(
    context: PipelineContext,
  ): PipelineContext {
    return {
      ...context,
      warnings: [
        ...context.warnings,
        'ResolveCategoriesStage: user has no categories to match against.',
      ],
    };
  }

  private buildCategoryCandidateProfiles(
    categories: Array<{ id: string; name: string }>,
  ): CategoryCandidateProfile[] {
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      normalizedName: this.normalizeComparableText(category.name),
      tokens: this.buildComparableTokens(category.name),
    }));
  }

  private resolveCategoriesForTransactions(
    transactions: ExtractedTransaction[],
    categoryCandidates: CategoryCandidateProfile[],
  ): Promise<CategoryResolutionAggregate> {
    return Promise.all(
      transactions.map((transaction, index) =>
        this.resolveCategoryForTransaction(
          transaction,
          index,
          categoryCandidates,
        ),
      ),
    ).then((results) => this.aggregateCategoryResolution(results));
  }

  private aggregateCategoryResolution(
    results: TransactionCategoryResolution[],
  ): CategoryResolutionAggregate {
    return {
      transactions: results.map((result) => result.transaction),
      warnings: results.flatMap((result) => result.warnings),
      categoryCreationSuggestions: results
        .map((result) => result.categoryCreationSuggestion)
        .filter(
          (suggestion): suggestion is CategoryCreationSuggestion =>
            suggestion !== undefined,
        ),
    };
  }

  private async resolveCategoryForTransaction(
    transaction: ExtractedTransaction,
    index: number,
    categoryCandidates: CategoryCandidateProfile[],
  ): Promise<TransactionCategoryResolution> {
    const deterministicMatch = this.computeDeterministicCategoryMatch(
      transaction,
      categoryCandidates,
    );
    const llmCandidates = this.pickTopCandidatesForLlmCheck(
      deterministicMatch.rankedCandidates,
    );
    const llmMatch = await this.requestLlmCategoryCheck(
      transaction,
      llmCandidates,
    );
    const decision = this.decideCategoryResolution(
      deterministicMatch,
      llmMatch,
      categoryCandidates,
    );

    return {
      transaction: this.buildResolvedTransaction(transaction, decision),
      warnings: this.buildResolutionWarnings({
        transactionIndex: index,
        deterministicMatch,
        llmMatch,
        decision,
      }),
      categoryCreationSuggestion: this.buildCategoryCreationSuggestion(
        index,
        decision,
      ),
    };
  }

  private computeDeterministicCategoryMatch(
    transaction: ExtractedTransaction,
    categoryCandidates: CategoryCandidateProfile[],
  ): DeterministicCategoryMatch {
    const rankedCandidates = this.rankCategoryCandidatesByDeterministicScore(
      transaction,
      categoryCandidates,
    );
    const bestCandidate = rankedCandidates[0];

    if (!bestCandidate || bestCandidate.score <= 0) {
      return {
        selectedCategoryId: null,
        confidence: 0,
        rankedCandidates,
      };
    }

    return {
      selectedCategoryId: bestCandidate.candidate.id,
      confidence: bestCandidate.score,
      rankedCandidates,
    };
  }

  private rankCategoryCandidatesByDeterministicScore(
    transaction: ExtractedTransaction,
    categoryCandidates: CategoryCandidateProfile[],
  ): RankedCategoryCandidate[] {
    return categoryCandidates
      .map((candidate) => ({
        candidate,
        score: this.calculateDeterministicScoreForCandidate(
          transaction,
          candidate,
        ),
      }))
      .sort((left, right) => right.score - left.score);
  }

  private calculateDeterministicScoreForCandidate(
    transaction: ExtractedTransaction,
    candidate: CategoryCandidateProfile,
  ): number {
    const extractedCategoryScore = this.calculateExtractedCategoryScore(
      transaction.category,
      candidate,
    );
    const merchantDescriptionScore = this.calculateMerchantDescriptionScore(
      transaction,
      candidate,
    );
    const combined = Math.max(
      extractedCategoryScore,
      merchantDescriptionScore * 0.8,
    );

    return Math.round(combined * 1000) / 1000;
  }

  private calculateExtractedCategoryScore(
    extractedCategory: string | undefined,
    candidate: CategoryCandidateProfile,
  ): number {
    if (!extractedCategory) {
      return 0;
    }

    const normalizedExtractedCategory =
      this.normalizeComparableText(extractedCategory);
    if (!normalizedExtractedCategory) {
      return 0;
    }

    if (normalizedExtractedCategory === candidate.normalizedName) {
      return 1;
    }

    const extractedTokens = this.buildComparableTokens(extractedCategory);
    return this.calculateTokenOverlapScore(extractedTokens, candidate.tokens);
  }

  private calculateMerchantDescriptionScore(
    transaction: ExtractedTransaction,
    candidate: CategoryCandidateProfile,
  ): number {
    const transactionTokens = this.buildComparableTokens(
      `${transaction.merchant} ${transaction.description ?? ''}`,
    );
    return this.calculateTokenOverlapScore(transactionTokens, candidate.tokens);
  }

  private calculateTokenOverlapScore(
    leftTokens: string[],
    rightTokens: string[],
  ): number {
    if (leftTokens.length === 0 || rightTokens.length === 0) {
      return 0;
    }

    const leftSet = new Set(leftTokens);
    const rightSet = new Set(rightTokens);
    const intersectionSize = [...leftSet].filter((token) =>
      rightSet.has(token),
    ).length;
    const unionSize = new Set([...leftSet, ...rightSet]).size;

    if (unionSize === 0) {
      return 0;
    }

    return intersectionSize / unionSize;
  }

  private pickTopCandidatesForLlmCheck(
    rankedCandidates: RankedCategoryCandidate[],
  ): CategoryCandidate[] {
    return rankedCandidates
      .slice(0, this.llmCandidateLimit)
      .map((rankedCandidate) => ({
        id: rankedCandidate.candidate.id,
        name: rankedCandidate.candidate.name,
      }));
  }

  private requestLlmCategoryCheck(
    transaction: ExtractedTransaction,
    candidates: CategoryCandidate[],
  ): Promise<CheckCategoryMatchResult> {
    return this.aiService.checkCategoryMatch({
      transaction: {
        date: transaction.date,
        merchant: transaction.merchant,
        amount: transaction.amount,
        currency: transaction.currency,
        category: transaction.category,
        description: transaction.description,
      },
      candidates,
    });
  }

  private decideCategoryResolution(
    deterministicMatch: DeterministicCategoryMatch,
    llmMatch: CheckCategoryMatchResult,
    categoryCandidates: CategoryCandidateProfile[],
  ): CategoryResolutionDecision {
    const deterministicApproved =
      this.isDeterministicMatchApproved(deterministicMatch);
    const llmApproved = this.isLlmMatchApproved(llmMatch);
    const bothChecksAgree = this.checkBothChecksAgreement(
      deterministicMatch,
      llmMatch,
    );

    if (deterministicApproved && llmApproved && bothChecksAgree) {
      return this.buildApprovedCategoryResolution(
        deterministicMatch,
        llmMatch,
        categoryCandidates,
      );
    }

    return this.buildUnresolvedCategoryDecision(llmMatch);
  }

  private isDeterministicMatchApproved(
    deterministicMatch: DeterministicCategoryMatch,
  ): boolean {
    return (
      !!deterministicMatch.selectedCategoryId &&
      deterministicMatch.confidence >= this.deterministicConfidenceThreshold
    );
  }

  private isLlmMatchApproved(llmMatch: CheckCategoryMatchResult): boolean {
    return (
      !!llmMatch.selectedCategoryId &&
      llmMatch.confidence >= this.llmConfidenceThreshold
    );
  }

  private checkBothChecksAgreement(
    deterministicMatch: DeterministicCategoryMatch,
    llmMatch: CheckCategoryMatchResult,
  ): boolean {
    return (
      !!deterministicMatch.selectedCategoryId &&
      !!llmMatch.selectedCategoryId &&
      deterministicMatch.selectedCategoryId === llmMatch.selectedCategoryId
    );
  }

  private buildApprovedCategoryResolution(
    deterministicMatch: DeterministicCategoryMatch,
    llmMatch: CheckCategoryMatchResult,
    categoryCandidates: CategoryCandidateProfile[],
  ): CategoryResolutionDecision {
    const selectedCategoryId = deterministicMatch.selectedCategoryId;
    const selectedCategoryName = this.findCategoryNameById(
      selectedCategoryId,
      categoryCandidates,
    );

    return {
      selectedCategoryId,
      selectedCategoryName,
      confidence: this.combineConfidenceScores(
        deterministicMatch.confidence,
        llmMatch.confidence,
      ),
      needsCategoryCreation: false,
    };
  }

  private findCategoryNameById(
    categoryId: string | null,
    categoryCandidates: CategoryCandidateProfile[],
  ): string | undefined {
    return categoryCandidates.find((candidate) => candidate.id === categoryId)
      ?.name;
  }

  private combineConfidenceScores(
    deterministicConfidence: number,
    llmConfidence: number,
  ): number {
    return (
      Math.round(((deterministicConfidence + llmConfidence) / 2) * 1000) / 1000
    );
  }

  private buildUnresolvedCategoryDecision(
    llmMatch: CheckCategoryMatchResult,
  ): CategoryResolutionDecision {
    return {
      selectedCategoryId: null,
      confidence: null,
      needsCategoryCreation: llmMatch.shouldCreateCategory,
      suggestedCategoryName: llmMatch.suggestedCategoryName,
    };
  }

  private buildCategoryCreationSuggestion(
    transactionIndex: number,
    decision: CategoryResolutionDecision,
  ): CategoryCreationSuggestion | undefined {
    if (!decision.needsCategoryCreation || !decision.suggestedCategoryName) {
      return undefined;
    }

    return {
      transactionIndex,
      name: decision.suggestedCategoryName,
    };
  }

  private buildResolvedTransaction(
    transaction: ExtractedTransaction,
    decision: CategoryResolutionDecision,
  ): ExtractedTransaction {
    if (!decision.selectedCategoryId) {
      return {
        ...transaction,
        categoryId: undefined,
        categoryMatchConfidence: undefined,
        needsCategoryCreation: decision.needsCategoryCreation,
        suggestedCategoryName: decision.suggestedCategoryName,
      };
    }

    return {
      ...transaction,
      categoryId: decision.selectedCategoryId,
      category: decision.selectedCategoryName ?? transaction.category,
      categoryMatchConfidence: decision.confidence ?? undefined,
      needsCategoryCreation: false,
      suggestedCategoryName: undefined,
    };
  }

  private buildResolutionWarnings(
    input: CategoryResolutionCheckInput,
  ): string[] {
    const { transactionIndex, deterministicMatch, llmMatch, decision } = input;
    const warnings: string[] = [];

    warnings.push(
      ...this.buildLlmWarningsForTransaction(
        transactionIndex,
        llmMatch.warnings,
      ),
    );

    if (!decision.selectedCategoryId) {
      warnings.push(
        this.buildCategoryNotResolvedWarning(
          transactionIndex,
          deterministicMatch,
          llmMatch,
        ),
      );
    }

    if (decision.needsCategoryCreation && decision.suggestedCategoryName) {
      warnings.push(
        `CategoryCreationSuggestion[index=${transactionIndex}]: ${decision.suggestedCategoryName}`,
      );
    }

    return warnings;
  }

  private buildLlmWarningsForTransaction(
    transactionIndex: number,
    llmWarnings: string[],
  ): string[] {
    return llmWarnings.map(
      (warning) => `CategoryLlmWarning[index=${transactionIndex}]: ${warning}`,
    );
  }

  private buildCategoryNotResolvedWarning(
    transactionIndex: number,
    deterministicMatch: DeterministicCategoryMatch,
    llmMatch: CheckCategoryMatchResult,
  ): string {
    return [
      `CategoryMatchNotResolved[index=${transactionIndex}]`,
      `deterministicCategoryId=${deterministicMatch.selectedCategoryId ?? 'none'}`,
      `deterministicConfidence=${deterministicMatch.confidence.toFixed(3)}`,
      `llmCategoryId=${llmMatch.selectedCategoryId ?? 'none'}`,
      `llmConfidence=${llmMatch.confidence.toFixed(3)}`,
    ].join(': ');
  }

  private logCategoryCreationSuggestions(
    contextSummary: CategoryResolutionContextSummary,
    suggestions: CategoryCreationSuggestion[],
  ): void {
    const payload = this.buildCategoryCreationLogPayload(
      contextSummary,
      suggestions,
    );

    console.log(
      '[ResolveCategoriesStage] category creation suggestions',
      JSON.stringify(payload, null, 2),
    );
  }

  private buildCategoryCreationLogPayload(
    contextSummary: CategoryResolutionContextSummary,
    suggestions: CategoryCreationSuggestion[],
  ): {
    uploadId: string;
    userId: string;
    suggestedCount: number;
    suggestions: CategoryCreationSuggestion[];
  } {
    return {
      uploadId: contextSummary.uploadId,
      userId: contextSummary.userId,
      suggestedCount: suggestions.length,
      suggestions,
    };
  }

  private buildContextWithCategoryResolution(
    context: PipelineContext,
    resolution: CategoryResolutionAggregate,
  ): PipelineContext {
    return {
      ...context,
      warnings: [...context.warnings, ...resolution.warnings],
      extractedTransactions: resolution.transactions,
    };
  }

  private normalizeComparableText(value: string): string {
    return value
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  private buildComparableTokens(value: string): string[] {
    const normalized = this.normalizeComparableText(value);
    if (!normalized) {
      return [];
    }

    return normalized
      .split(' ')
      .map((token) => this.normalizeComparableToken(token))
      .filter((token) => token.length >= 2);
  }

  private normalizeComparableToken(token: string): string {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return '';
    }

    return this.comparableTokenAliases[normalizedToken] ?? normalizedToken;
  }
}
