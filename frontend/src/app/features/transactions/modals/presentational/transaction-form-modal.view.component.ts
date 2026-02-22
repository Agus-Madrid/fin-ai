import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgFor } from '@angular/common';

export interface TransactionFormDraft {
  description: string;
  amount: string;
  date: string;
  category: string;
}

@Component({
  selector: 'app-transaction-form-modal-view',
  standalone: true,
  imports: [NgFor],
  templateUrl: './transaction-form-modal.view.component.html',
  styleUrl: './transaction-form-modal.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormModalViewComponent {
  readonly title = input('Edit transaction');
  readonly saveText = input('Save changes');
  readonly cancelText = input('Cancel');
  readonly categories = input<string[]>([]);
  readonly draft = input<TransactionFormDraft>({
    description: '',
    amount: '',
    date: '',
    category: ''
  });

  readonly cancel = output<void>();
  readonly save = output<void>();
}
