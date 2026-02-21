import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransactionsViewComponent } from '../presentational/transactions.view.component';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [NgIf, TransactionsViewComponent],
  template: `
    <ng-container *ngIf="transactionResource">
      <app-transactions-view [transactions]="transactionResource"></app-transactions-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsPageComponent {
  private readonly transactionService = inject(TransactionService);
  readonly transactionResource = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);
}
