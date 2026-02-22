import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TransactionFormModalViewComponent } from '../presentational/transaction-form-modal.view.component';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';

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
      [transaction]="transaction"
      [form]="form"
      [formControlNames]="formControlNames"
      (save)="onSave($event)"
      (cancel)="cancel.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormModalContainerComponent {
  save = output<Transaction>();
  cancel = output<void>();
  
  readonly title = 'Edit transaction';
  readonly saveText = 'Save changes';
  readonly cancelText = 'Cancel';

  categories: Category[] = [];
  transaction: Transaction | null = null;
  form: FormGroup | null = null;

  formControlNames = {
    description: 'description',
    categoryId: 'categoryId',
    date: 'date',
    amount: 'amount'
  } as const;

  onSave(event: Transaction): void {
    this.save.emit(event);
  }
}
