import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { TransactionsVm } from '../../../shared/models/transactions-page.model';
import { Transaction } from '../../../shared/models/transaction.model';

@Component({
  selector: 'app-transactions-view',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe],
  templateUrl: './transactions.view.component.html',
  styleUrl: './transactions.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsViewComponent {
  @Input({ required: true }) vm!: TransactionsVm;

  formatAmount(transaction: Transaction) {
    return transaction.type === 'expense' ? -transaction.amount : transaction.amount;
  }
}
