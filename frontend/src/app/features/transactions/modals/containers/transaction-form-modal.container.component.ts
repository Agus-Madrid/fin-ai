import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TransactionFormModalViewComponent } from '../presentational/transaction-form-modal.view.component';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [TransactionFormModalViewComponent],
  template: `
    <app-transaction-form-modal-view
      [title]="title"
      [saveText]="saveText"
      [cancelText]="cancelText"
      [categories]="categories"
      [draft]="draft"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormModalContainerComponent {
  readonly title = 'Edit transaction';
  readonly saveText = 'Save changes';
  readonly cancelText = 'Cancel';
  readonly categories = ['Food', 'Transport', 'Services', 'Shopping'];

  readonly draft = {
    description: 'Coffee purchase',
    amount: '12.50',
    date: '2026-02-22',
    category: 'Food'
  };
}
