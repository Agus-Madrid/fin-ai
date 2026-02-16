import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransactionsDataService } from '../../../core/data/transactions-data.service';
import { TransactionsViewComponent } from '../presentational/transactions.view.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, TransactionsViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-transactions-view [vm]="vm"></app-transactions-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsPageComponent {
  private readonly data = inject(TransactionsDataService);
  readonly vm$ = this.data.getTransactionsVm();
}
