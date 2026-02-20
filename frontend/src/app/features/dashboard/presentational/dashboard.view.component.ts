import { ChangeDetectionStrategy, Component, input, output, ResourceRef } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor, SlicePipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../shared/models/category.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [NgFor, NgClass, CurrencyPipe, ReactiveFormsModule, SlicePipe],
  templateUrl: './dashboard.view.component.html',
  styleUrl: './dashboard.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardViewComponent {
  TransactionStatus = TransactionStatus;

  readonly transactions = input.required<ResourceRef<Transaction[]>>();
  readonly transactionCategories = input.required<{ category: Category; amount: number }[]>();
  readonly user = input.required<User>();
  readonly manualTransactionFormGroup = input<FormGroup>();
  readonly categories = input<Category[]>([]);
  readonly submitTransaction = output<void>();

  getSpendableLabel() {
    return 'Dinero Gastable';
  }

  buildPieGradient() {
    const items = this.transactionCategories() ?? [];
    if (!items.length) return 'conic-gradient(#2e2e2e 0 100%)';

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    let start = 0;

    const segments = items.map((item) => {
      const value = total === 0 ? 0 : (item.amount / total) * 100;
      const end = start + value;
      const segment = `${item.category.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }


  onSubmit() {
    this.submitTransaction.emit();
  }
}
