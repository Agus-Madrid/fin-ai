import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../../../shared/models/transaction.model';
import { Category } from '../../../shared/models/category.model';
import { User } from '../../../shared/models/user.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="transactions">
      <app-dashboard-view
        [transactions]="transactions"
        [user]="user"
        [manualTransactionFormGroup]="manualTransactionFormGroup"
        [transactionCategories]="transactionCategories()"
        [categories]="categories()"
        (submitTransaction)="createTransaction()"
      ></app-dashboard-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoryService);
  private readonly transactionsService = inject(TransactionService);

  readonly manualTransactionFormGroup: FormGroup = this.fb.group({
    amount: [0, Validators.required],
    date: ['', Validators.required],
    description: ['', Validators.required],
    categoryId: ['', Validators.required]
  });

  readonly categoriesResource = this.categoriesService.getCategories();
  readonly categories = this.categoriesResource.value;

  readonly transactions = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);
  readonly transactionCategories = computed(() => this.getTransactionCategories());
  readonly user: User = {
    id: 'user-001',
    name: 'Sofia Mercado',
    password: 'demo-password',
    email: 'sofia.mercado@example.com',
    createdAt: new Date('2026-02-10T10:00:00Z'),
    currentTotalSavings: 1200,
    savingGoals: [
      {
        id: 'goal-001',
        name: 'Fondo de emergencia',
        targetAmount: 5000,
        deadline: new Date('2026-12-01'),
        priority: 1
      }
    ]
  };

  async createTransaction() {
    if (this.manualTransactionFormGroup.invalid) {
      this.manualTransactionFormGroup.markAllAsTouched();
      return;
    }

    const formValue = this.manualTransactionFormGroup.getRawValue();
    await firstValueFrom(
      this.transactionsService.create({
        amount: formValue.amount,
        date: formValue.date,
        description: formValue.description,
        categoryId: formValue.categoryId
      })
    );

    this.transactions.reload();

    this.manualTransactionFormGroup.reset({
      amount: 0,
      date: '',
      description: '',
      categoryId: ''
    });
  }

  getTransactionCategories(): { category: Category; amount: number }[] {
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

    const categoriesMap = new Map<string, { category: Category; amount: number }>();
    transactions.forEach((txn: Transaction) => {
      const rawAmount = Number(txn.amount) || 0;
      const spendAmount = Math.abs(rawAmount);
      if (spendAmount <= 0) {
        return;
      }

      const txCategory = txn.category as Category | null | undefined;
      const categoryId = txCategory?.id != null ? String(txCategory.id) : 'uncategorized';
      const existing = categoriesMap.get(categoryId);

      if (existing) {
        existing.amount += spendAmount;
        return;
      }

      const categoryFromCatalog = categoriesById.get(categoryId);
      const fallbackCategory: Category = {
        id: 'uncategorized',
        name: 'Sin categoria',
        icon: 'bi bi-question-circle',
        color: '#7d7d86'
      };

      const normalizedCategory: Category = categoryFromCatalog ?? txCategory ?? fallbackCategory;
      categoriesMap.set(categoryId, { category: normalizedCategory, amount: spendAmount });
    });

    return Array.from(categoriesMap.values()).sort((a, b) => b.amount - a.amount);
  }
}
