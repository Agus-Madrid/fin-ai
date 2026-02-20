import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../../../shared/models/transaction.model';
import { Category } from '../../../shared/models/category.model';
import { User } from '../../../shared/models/user.model';

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
        [transactionCategories]="getTransactionCategories()"
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

  readonly transactions = this.transactionService.getTransactions();
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

    this.manualTransactionFormGroup.reset({
      amount: 0,
      date: '',
      description: '',
      categoryId: ''
    });
  }

  getTransactionCategories(): { category: Category; amount: number }[] {
    const transactions = this.transactions.value();
    const categoriesMap = new Map<string, number>();
    transactions.forEach((txn: Transaction) => {
      const existing = categoriesMap.get(txn.category.id);
      categoriesMap.set(txn.category.id, (existing || 0) + txn.amount);
    });

    const result: { category: Category; amount: number }[] = [];
    for (const [categoryId, amount] of categoriesMap.entries()) {
      const category = this.categories().find((c) => c.id === categoryId);
      if (category) {
        result.push({ category, amount });
      }
    }
    return result;
  }
}
