import { ChangeDetectionStrategy, Component, input, output, ResourceRef } from '@angular/core';
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
  TransactionStatus = TransactionStatus;
  
  readonly createRequested = output<void>();
  readonly editRequested = output<Transaction>();
  readonly deleteRequested = output<Transaction>();
  readonly transactions = input.required<ResourceRef<Transaction[] | undefined>>();

  createTransaction(): void {
    this.createRequested.emit();
  }

  editTransaction(tx:Transaction) {
    this.editRequested.emit(tx);
  }

  deleteTransaction(tx: Transaction) {
    this.deleteRequested.emit(tx);
  }
  
}
