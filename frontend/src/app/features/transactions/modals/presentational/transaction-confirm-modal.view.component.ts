import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-transaction-confirm-modal-view',
  standalone: true,
  imports: [NgClass],
  templateUrl: './transaction-confirm-modal.view.component.html',
  styleUrl: './transaction-confirm-modal.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionConfirmModalViewComponent {
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to continue?');
  readonly cancelText = input('Cancel');
  readonly confirmText = input('Confirm');
  readonly tone = input<'danger' | 'primary'>('danger');

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
