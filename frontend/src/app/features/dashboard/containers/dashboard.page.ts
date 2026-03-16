import { AsyncPipe, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, finalize, startWith } from 'rxjs';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { BudgetOverviewService } from '../services/budget-overview.service';
import { CategoryService } from '../services/category.service';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../../../shared/models/transaction.model';
import { Category } from '../../../shared/models/category.model';
import { User } from '../../../shared/models/user.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { BudgetPlannerService } from '../../budget-planner/services/budget-planner.service';
import { parseUruguayNumber } from '../../../shared/utils/number-format.util';
import { BudgetOverview } from '../../../shared/models/budget-overview.model';
import { UploadViewModel } from '../../../shared/models/upload.model';
import { UploadsDataService } from '../../../core/data/uploads-data.service';
import { IngestionService } from '../../uploads/services/ingestion.service';

const DEFAULT_USER: User = {
  id: '',
  name: 'Usuario',
  email: '',
  createdAt: new Date(),
  currentTotalSavings: 0,
  goalMonthlySavings: 0,
  savingGoals: []
};

const DEFAULT_BUDGET_OVERVIEW: BudgetOverview = {
  currency: 'UYU',
  currentPeriod: '',
  totalIncome: 0,
  totalFixedExpenses: 0,
  savingsConfirmedAmount: 0,
  fixedExpensePercent: 0,
  spendableBalance: 0,
  spendablePercent: 0
};

const DEFAULT_UPLOAD_VIEW_MODEL: UploadViewModel = {
  uploads: []
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="transactions">
      <ng-container *ngIf="uploadViewModel$ | async as uploadViewModel">
        <app-dashboard-view
          [transactions]="transactions"
          [user]="dashboardUser()"
          [totalIncome]="totalIncome()"
          [totalFixedExpenses]="totalFixedExpenses()"
          [fixedExpensePercent]="fixedExpensePercent()"
          [spendableBalance]="spendableBalance()"
          [spendablePercent]="spendablePercent()"
          [manualTransactionFormGroup]="manualTransactionFormGroup"
          [transactionCategories]="transactionCategories()"
          [categories]="categories()"
          [smartUpload]="uploadViewModel.uploads.length > 0 ? uploadViewModel.uploads[0] : null"
          [smartUploading]="smartUploading()"
          [smartProcessingUploadId]="smartProcessingUploadId()"
          [smartErrorMessage]="smartErrorMessage()"
          (submitTransaction)="createTransaction()"
          (smartUploadRequested)="onSmartUploadRequested($event)"
          (smartProcessRequested)="onSmartProcessRequested($event)"
        ></app-dashboard-view>
      </ng-container>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesService = inject(CategoryService);
  private readonly budgetPlannerService = inject(BudgetPlannerService);
  private readonly budgetOverviewService = inject(BudgetOverviewService);
  private readonly uploadsDataService = inject(UploadsDataService);
  private readonly ingestionService = inject(IngestionService);

  readonly manualTransactionFormGroup: FormGroup = this.createManualTransactionFormGroup();
  readonly smartUploading = signal(false);
  readonly smartProcessingUploadId = signal<string | null>(null);
  readonly smartErrorMessage = signal<string | null>(null);

  readonly categoriesResource = this.categoriesService.getCategories();
  readonly categories = this.categoriesResource.value;
  readonly transactions = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);
  readonly userResource = this.budgetPlannerService.getUser();
  readonly budgetOverviewResource = this.budgetOverviewService.getOverview();
  readonly uploadViewModel$: Observable<UploadViewModel> = this.uploadsDataService
    .getUploadsViewModel()
    .pipe(startWith(DEFAULT_UPLOAD_VIEW_MODEL));

  readonly totalIncome = this.createTotalIncomeComputed();
  readonly totalFixedExpenses = this.createTotalFixedExpensesComputed();
  readonly fixedExpensePercent = this.createFixedExpensePercentComputed();
  readonly spendableBalance = this.createSpendableBalanceComputed();
  readonly spendablePercent = this.createSpendablePercentComputed();
  readonly dashboardUser = this.createDashboardUserComputed();
  readonly transactionCategories = this.createTransactionCategoriesComputed();

  onSmartUploadRequested(file: File): void {
    this.smartErrorMessage.set(null);

    this.smartUploading.set(true);
    this.uploadsDataService
      .uploadPdf(file)
      .pipe(finalize(() => this.smartUploading.set(false)))
      .subscribe({
        next: () => {},
        error: (error: unknown) => {
          this.smartErrorMessage.set(this.resolveUploadErrorMessage(error));
        }
      });
  }

  onSmartProcessRequested(uploadId: string): void {
    this.smartErrorMessage.set(null);
    this.smartProcessingUploadId.set(uploadId);

    this.ingestionService
      .processUpload(uploadId)
      .pipe(finalize(() => this.smartProcessingUploadId.set(null)))
      .subscribe({
        next: () => {
          this.uploadsDataService.reloadUploads();
        },
        error: (error: unknown) => {
          this.smartErrorMessage.set(this.resolveUploadErrorMessage(error));
        }
      });
  }

  createTransaction(): void {
    this.manualTransactionFormGroup.setErrors(null);

    if (this.manualTransactionFormGroup.invalid) {
      this.manualTransactionFormGroup.markAllAsTouched();
      return;
    }

    const formValue = this.manualTransactionFormGroup.getRawValue();
    const amount = parseUruguayNumber(formValue.amount);
    if (!Number.isFinite(amount)) {
      this.manualTransactionFormGroup.controls['amount'].setErrors({ invalidNumber: true });
      return;
    }

    this.manualTransactionFormGroup.controls['amount'].setErrors(null);

    this.transactionService
      .create({
        amount,
        date: formValue.date,
        description: formValue.description,
        categoryId: formValue.categoryId
      })
      .subscribe({
        next: () => {
          this.transactions.reload();
          this.budgetOverviewResource.reload();

          this.manualTransactionFormGroup.reset({
            amount: '',
            date: '',
            description: '',
            categoryId: ''
          });
        },
        error: () => {
          this.manualTransactionFormGroup.setErrors({ submitFailed: true });
        }
      });
  }

  private createManualTransactionFormGroup(): FormGroup {
    return this.formBuilder.group({
      amount: [0, Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
  }

  private createTotalIncomeComputed() {
    return computed(() => this.getBudgetOverview().totalIncome);
  }

  private createTotalFixedExpensesComputed() {
    return computed(() => this.getBudgetOverview().totalFixedExpenses);
  }

  private createFixedExpensePercentComputed() {
    return computed(() => this.getBudgetOverview().fixedExpensePercent);
  }

  private createSpendableBalanceComputed() {
    return computed(() => this.getBudgetOverview().spendableBalance);
  }

  private createSpendablePercentComputed() {
    return computed(() => this.getBudgetOverview().spendablePercent);
  }

  private createDashboardUserComputed() {
    return computed(() => this.resolveDashboardUser());
  }

  private createTransactionCategoriesComputed() {
    return computed(() => this.buildTransactionCategories());
  }

  private buildTransactionCategories(): { category: Category; amount: number }[] {
    if (!this.transactions) {
      return [];
    }

    const transactions = this.transactions.value() ?? [];
    if (!transactions.length) {
      return [];
    }

    const categoriesById = new Map(
      (this.categories() ?? []).map((category) => [String(category.id), category] as const)
    );
    const groupedCategories = new Map<string, { category: Category; amount: number }>();

    transactions.forEach((transaction: Transaction) => {
      const rawAmount = Number(transaction.amount) || 0;
      const spendAmount = Math.abs(rawAmount);
      if (spendAmount <= 0) {
        return;
      }

      const transactionCategory = transaction.category as Category | null | undefined;
      const categoryId = transactionCategory?.id == null ? 'uncategorized' : String(transactionCategory.id);
      const existingCategory = groupedCategories.get(categoryId);
      if (existingCategory) {
        existingCategory.amount += spendAmount;
        return;
      }

      const categoryFromCatalog = categoriesById.get(categoryId);
      const fallbackCategory: Category = {
        id: 'uncategorized',
        name: 'Sin categoria',
        icon: '?',
        color: '#7d7d86'
      };

      const resolvedCategory = categoryFromCatalog ?? transactionCategory ?? fallbackCategory;
      groupedCategories.set(categoryId, { category: resolvedCategory, amount: spendAmount });
    });

    return Array.from(groupedCategories.values()).sort((left, right) => right.amount - left.amount);
  }

  private resolveDashboardUser(): User {
    const user = this.userResource.value();
    if (!user) {
      return DEFAULT_USER;
    }

    return {
      ...user,
      savingGoals: user.savingGoals ?? []
    };
  }

  private getBudgetOverview(): BudgetOverview {
    return this.budgetOverviewResource.value() ?? DEFAULT_BUDGET_OVERVIEW;
  }

  private resolveUploadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.readBackendMessage(error.error);
      if (message) {
        return message;
      }
      return 'No fue posible completar la operacion con el archivo PDF.';
    }

    return 'No fue posible completar la operacion con el archivo PDF.';
  }

  private readBackendMessage(errorBody: unknown): string | null {
    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const body = errorBody as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    if (typeof body.message === 'string') {
      return body.message;
    }

    return null;
  }
}
