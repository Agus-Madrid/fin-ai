import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';
import { CreateTransactionRequest } from '../../../../shared/models/transaction-create.model';
import { parseUruguayNumber } from '../../../../shared/utils/number-format.util';
import {
  TRANSACTION_FORM_CONTROL_NAMES,
  TransactionFormControlNames,
  TransactionFormSavePayload,
  TransactionFormValue,
  TransactionFormGroup
} from '../transaction-form.types';

@Component({
  selector: 'app-transaction-form-modal-view',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './transaction-form-modal.view.component.html',
  styleUrl: './transaction-form-modal.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormModalViewComponent {
  readonly title = input('Edit transaction');
  readonly subtitle = input('Update details for a confirmed transaction.');
  readonly saveText = input('Save changes');
  readonly cancelText = input('Cancel');
  readonly categories = input<Category[]>([]);
  readonly transaction = input<Transaction | null>(null);
  readonly form = input<TransactionFormGroup | null>(null);

  readonly formControlNames = input<TransactionFormControlNames>(TRANSACTION_FORM_CONTROL_NAMES);

  readonly dismissRequested = output<void>();
  readonly saveRequested = output<TransactionFormSavePayload>();

  onSave(): void {
    const form = this.form();
    if (!form?.valid) {
      return;
    }

    const formData: TransactionFormValue = form.getRawValue();
    const { description, amount, date, categoryId } = formData;
    const parsedAmount = parseUruguayNumber(amount);
    if (!Number.isFinite(parsedAmount)) {
      return;
    }

    const request: CreateTransactionRequest = {
      description,
      amount: parsedAmount,
      date,
      categoryId
    };

    this.saveRequested.emit({
      request,
      transactionId: this.transaction()?.id ?? null
    });
  }
}
