import { Injectable } from '@nestjs/common';
import { ExtractedTransaction } from '../../../../core/ai/interfaces';
import { CategoryService } from '../../../categories/category.service';
import {
  CategoryCreationOutcome,
  CategoryCreationPlan,
  CategoryCreationRequest,
  CategoryReference,
  CreateCategoriesContextSummary,
  CreateCategoriesStageResult,
} from '../interfaces/create-categories';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class CreateCategoriesStage implements PipelineStage {
  readonly name = 'create-categories';
  private readonly spanishCategoryNameAliases: Record<string, string> = {
    food: 'Alimentos',
    groceries: 'Supermercado',
    grocery: 'Supermercado',
    supermarket: 'Supermercado',
    market: 'Supermercado',
    transport: 'Transporte',
    fuel: 'Combustible',
    gasoline: 'Combustible',
    subscription: 'Suscripciones',
    subscriptions: 'Suscripciones',
    entertainment: 'Entretenimiento',
    healthcare: 'Salud',
    health: 'Salud',
    medical: 'Salud',
    pharmacy: 'Salud',
    utilities: 'Servicios',
    services: 'Servicios',
  };

  constructor(private readonly categoryService: CategoryService) {}

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = this.readTransactionsFromContext(context);
    if (transactions.length === 0) {
      return context;
    }

    const contextSummary = this.buildContextSummary(context);
    const existingCategories = await this.loadUserCategories(context.userId);
    const initialCategoryLookup = this.buildCategoryLookup(existingCategories);
    const creationPlan = this.buildCategoryCreationPlan(
      transactions,
      initialCategoryLookup,
    );
    this.logCategoryCreationPlan(contextSummary, creationPlan.requests);

    const creationOutcome = await this.createCategoriesFromPlan(
      context.userId,
      creationPlan.requests,
      initialCategoryLookup,
    );
    const transactionsWithCategories = this.assignCategoriesToTransactions(
      transactions,
      creationOutcome.categoryLookup,
    );
    const stageResult = this.buildCreateCategoriesStageResult(
      transactionsWithCategories,
      creationPlan,
      creationOutcome,
    );
    this.logCategoryCreationResult(contextSummary, stageResult);

    return this.buildContextWithCreateCategoriesResult(context, stageResult);
  }

  private readTransactionsFromContext(
    context: PipelineContext,
  ): ExtractedTransaction[] {
    return context.extractedTransactions ?? [];
  }

  private buildContextSummary(
    context: PipelineContext,
  ): CreateCategoriesContextSummary {
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

  private buildCategoryLookup(
    categories: Array<{ id: string; name: string }>,
  ): Map<string, CategoryReference> {
    const lookup = new Map<string, CategoryReference>();

    categories
      .map((category) => this.mapCategoryToReference(category))
      .forEach((categoryReference) => {
        lookup.set(categoryReference.normalizedName, categoryReference);
      });

    return lookup;
  }

  private mapCategoryToReference(category: {
    id: string;
    name: string;
  }): CategoryReference {
    return {
      id: category.id,
      name: category.name,
      normalizedName: this.normalizeCategoryName(category.name),
    };
  }

  private buildCategoryCreationPlan(
    transactions: ExtractedTransaction[],
    categoryLookup: Map<string, CategoryReference>,
  ): CategoryCreationPlan {
    const requestByNormalizedName = new Map<string, CategoryCreationRequest>();
    const warnings: string[] = [];

    transactions.forEach((transaction, index) => {
      this.addTransactionCategoryCreationRequest(
        transaction,
        index,
        categoryLookup,
        requestByNormalizedName,
        warnings,
      );
    });

    return {
      requests: Array.from(requestByNormalizedName.values()),
      warnings,
    };
  }

  private addTransactionCategoryCreationRequest(
    transaction: ExtractedTransaction,
    transactionIndex: number,
    categoryLookup: Map<string, CategoryReference>,
    requestByNormalizedName: Map<string, CategoryCreationRequest>,
    warnings: string[],
  ): void {
    const categoryName = this.pickCategoryNameForCreation(transaction);
    if (!categoryName) {
      return;
    }

    const normalizedCategoryName = this.normalizeCategoryName(categoryName);
    if (!normalizedCategoryName) {
      warnings.push(
        `CreateCategoriesStage: empty category suggestion at transaction index ${transactionIndex}.`,
      );
      return;
    }

    if (categoryLookup.has(normalizedCategoryName)) {
      return;
    }

    this.appendCategoryCreationRequest(
      requestByNormalizedName,
      normalizedCategoryName,
      categoryName,
      transactionIndex,
    );
  }

  private pickCategoryNameForCreation(
    transaction: ExtractedTransaction,
  ): string | undefined {
    if (transaction.categoryId) {
      return undefined;
    }

    if (!transaction.needsCategoryCreation) {
      return undefined;
    }

    const preferredName =
      transaction.suggestedCategoryName?.trim() ?? transaction.category?.trim();

    if (!preferredName) {
      return undefined;
    }

    return this.mapCategoryNameToSpanish(preferredName);
  }

  private appendCategoryCreationRequest(
    requestByNormalizedName: Map<string, CategoryCreationRequest>,
    normalizedCategoryName: string,
    categoryName: string,
    transactionIndex: number,
  ): void {
    const existingRequest = requestByNormalizedName.get(normalizedCategoryName);
    if (existingRequest) {
      existingRequest.transactionIndexes.push(transactionIndex);
      return;
    }

    requestByNormalizedName.set(normalizedCategoryName, {
      normalizedName: normalizedCategoryName,
      displayName: categoryName,
      transactionIndexes: [transactionIndex],
    });
  }

  private async createCategoriesFromPlan(
    userId: string,
    requests: CategoryCreationRequest[],
    initialCategoryLookup: Map<string, CategoryReference>,
  ): Promise<CategoryCreationOutcome> {
    const categoryLookup = new Map(initialCategoryLookup);
    const createdCategories: CategoryReference[] = [];
    const warnings: string[] = [];

    for (const request of requests) {
      await this.createCategoryFromRequest(
        userId,
        request,
        categoryLookup,
        createdCategories,
        warnings,
      );
    }

    return {
      categoryLookup,
      createdCategories,
      warnings,
    };
  }

  private async createCategoryFromRequest(
    userId: string,
    request: CategoryCreationRequest,
    categoryLookup: Map<string, CategoryReference>,
    createdCategories: CategoryReference[],
    warnings: string[],
  ): Promise<void> {
    if (categoryLookup.has(request.normalizedName)) {
      return;
    }

    try {
      const createdCategory = await this.categoryService.create(userId, {
        name: request.displayName,
      });
      const createdCategoryReference = this.mapCategoryToReference(createdCategory);
      categoryLookup.set(
        createdCategoryReference.normalizedName,
        createdCategoryReference,
      );
      createdCategories.push(createdCategoryReference);
    } catch {
      warnings.push(
        `CreateCategoriesStage: failed to create category "${request.displayName}".`,
      );
    }
  }

  private assignCategoriesToTransactions(
    transactions: ExtractedTransaction[],
    categoryLookup: Map<string, CategoryReference>,
  ): ExtractedTransaction[] {
    return transactions.map((transaction) =>
      this.assignCategoryToTransaction(transaction, categoryLookup),
    );
  }

  private assignCategoryToTransaction(
    transaction: ExtractedTransaction,
    categoryLookup: Map<string, CategoryReference>,
  ): ExtractedTransaction {
    if (transaction.categoryId) {
      return transaction;
    }

    const categoryNameForAssignment =
      this.pickCategoryNameForAssignment(transaction);
    if (!categoryNameForAssignment) {
      return transaction;
    }

    const normalizedCategoryName = this.normalizeCategoryName(
      categoryNameForAssignment,
    );
    if (!normalizedCategoryName) {
      return transaction;
    }

    const matchedCategory = categoryLookup.get(normalizedCategoryName);
    if (!matchedCategory) {
      return transaction;
    }

    return {
      ...transaction,
      categoryId: matchedCategory.id,
      category: matchedCategory.name,
      needsCategoryCreation: false,
      suggestedCategoryName: undefined,
    };
  }

  private pickCategoryNameForAssignment(
    transaction: ExtractedTransaction,
  ): string | undefined {
    const preferredName =
      transaction.suggestedCategoryName?.trim() ?? transaction.category?.trim();

    if (!preferredName) {
      return undefined;
    }

    return this.mapCategoryNameToSpanish(preferredName);
  }

  private buildCreateCategoriesStageResult(
    transactions: ExtractedTransaction[],
    creationPlan: CategoryCreationPlan,
    creationOutcome: CategoryCreationOutcome,
  ): CreateCategoriesStageResult {
    const unresolvedTransactionIndexes =
      this.collectUnresolvedTransactionIndexes(transactions);

    return {
      transactions,
      warnings: this.buildCreateCategoriesWarnings(
        creationPlan,
        creationOutcome,
        unresolvedTransactionIndexes,
      ),
      createdCategories: creationOutcome.createdCategories,
      unresolvedTransactionIndexes,
    };
  }

  private collectUnresolvedTransactionIndexes(
    transactions: ExtractedTransaction[],
  ): number[] {
    const unresolvedIndexes: number[] = [];

    transactions.forEach((transaction, index) => {
      if (!transaction.needsCategoryCreation || transaction.categoryId) {
        return;
      }

      unresolvedIndexes.push(index);
    });

    return unresolvedIndexes;
  }

  private buildCreateCategoriesWarnings(
    creationPlan: CategoryCreationPlan,
    creationOutcome: CategoryCreationOutcome,
    unresolvedTransactionIndexes: number[],
  ): string[] {
    return [
      ...creationPlan.warnings,
      ...creationOutcome.warnings,
      ...this.buildUnresolvedCategoryWarnings(unresolvedTransactionIndexes),
    ];
  }

  private buildUnresolvedCategoryWarnings(
    unresolvedTransactionIndexes: number[],
  ): string[] {
    return unresolvedTransactionIndexes.map(
      (index) =>
        `CreateCategoriesStage: category still unresolved at transaction index ${index}.`,
    );
  }

  private logCategoryCreationPlan(
    contextSummary: CreateCategoriesContextSummary,
    requests: CategoryCreationRequest[],
  ): void {
    console.log(
      '[CreateCategoriesStage] creation plan',
      JSON.stringify(
        {
          uploadId: contextSummary.uploadId,
          userId: contextSummary.userId,
          requestCount: requests.length,
          requests,
        },
        null,
        2,
      ),
    );
  }

  private logCategoryCreationResult(
    contextSummary: CreateCategoriesContextSummary,
    result: CreateCategoriesStageResult,
  ): void {
    console.log(
      '[CreateCategoriesStage] creation result',
      JSON.stringify(
        {
          uploadId: contextSummary.uploadId,
          userId: contextSummary.userId,
          createdCount: result.createdCategories.length,
          createdCategories: result.createdCategories,
          unresolvedCount: result.unresolvedTransactionIndexes.length,
          unresolvedTransactionIndexes: result.unresolvedTransactionIndexes,
        },
        null,
        2,
      ),
    );
  }

  private buildContextWithCreateCategoriesResult(
    context: PipelineContext,
    result: CreateCategoriesStageResult,
  ): PipelineContext {
    return {
      ...context,
      extractedTransactions: result.transactions,
      warnings: [...context.warnings, ...result.warnings],
    };
  }

  private normalizeCategoryName(value: string): string {
    return value
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  private mapCategoryNameToSpanish(value: string): string {
    const trimmedValue = value.trim();
    const normalizedValue = this.normalizeCategoryName(trimmedValue);
    if (!normalizedValue) {
      return trimmedValue;
    }

    return this.spanishCategoryNameAliases[normalizedValue] ?? trimmedValue;
  }
}
