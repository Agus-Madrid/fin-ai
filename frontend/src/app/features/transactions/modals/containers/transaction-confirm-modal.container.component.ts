import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TransactionConfirmModalViewComponent } from '../presentational/transaction-confirm-modal.view.component';

@Component({
  selector: 'app-transaction-confirm-modal',
  standalone: true,
  imports: [TransactionConfirmModalViewComponent],
  template: `
    <app-transaction-confirm-modal-view
      [title]="title"
      [message]="message"
      [cancelText]="cancelText"
      [confirmText]="confirmText"
      [tone]="tone"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionConfirmModalContainerComponent {
  readonly title = 'Delete transaction';
  readonly message = 'This action cannot be undone.';
  readonly cancelText = 'Cancel';
  readonly confirmText = 'Delete';
  readonly tone: 'danger' | 'primary' = 'danger';
}
