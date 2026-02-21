import { ChangeDetectionStrategy, Component, input, ResourceRef } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';

@Component({
  selector: 'app-transactions-view',
  standalone: true,
  imports: [CurrencyPipe, NgFor],
  templateUrl: './transactions.view.component.html',
  styleUrl: './transactions.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsViewComponent {
  readonly transactions = input.required<ResourceRef<Transaction[] | undefined>>();
  TransactionStatus = TransactionStatus;
}
