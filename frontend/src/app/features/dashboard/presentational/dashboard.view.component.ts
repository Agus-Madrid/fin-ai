import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { DashboardVm } from '../../../shared/models/dashboard.model';
import { Transaction } from '../../../shared/models/transaction.model';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [NgFor, NgClass, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './dashboard.view.component.html',
  styleUrl: './dashboard.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardViewComponent {
  readonly vm = input.required<DashboardVm>();
  readonly manualTransactionFormGroup = input<FormGroup>();
  categories = input<Category[]>();

  getSpendableLabel() {
    return 'Dinero Gastable';
  }

  formatAmount(transaction: Transaction) {
    const signed = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    return signed;
  }

  buildPieGradient() {
    const vm = this.vm();
    if (!vm?.categories?.length) {
      return 'conic-gradient(#2e2e2e 0 100%)';
    }
    const total = vm.categories.reduce((sum, item) => sum + item.amount, 0);
    let start = 0;
    const segments = vm.categories.map((item) => {
      const value = total === 0 ? 0 : (item.amount / total) * 100;
      const end = start + value;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }
}
