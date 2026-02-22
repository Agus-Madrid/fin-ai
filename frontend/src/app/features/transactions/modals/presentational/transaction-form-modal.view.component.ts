import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';

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
  readonly saveText = input('Save changes');
  readonly cancelText = input('Cancel');
  readonly categories = input<Category[]>([]);
  readonly transaction = input<Transaction | null>(null);
  readonly form = input<FormGroup | null>(null);
  
  readonly formControlNames = input({
    description: 'description',
    categoryId: 'categoryId',
    date: 'date',
    amount: 'amount'
  } as const);

  readonly cancel = output<void>();
  readonly save = output<Transaction>();

  onSave(): void {
    const form = this.form();
    const baseTransaction = this.transaction();
    if (!form?.valid || !baseTransaction) {
      return;
    }

    const formData = form.getRawValue() as Record<string, unknown>;
    const selectedCategoryId = String(formData[this.formControlNames().categoryId] ?? '');
    const selectedCategory =
      this.categories().find((category) => category.id === selectedCategoryId) ?? baseTransaction.category;

    const editedTransaction: Transaction = {
      ...baseTransaction,
      description: String(formData[this.formControlNames().description] ?? ''),
      amount: Number(formData[this.formControlNames().amount] ?? 0),
      date: this.toDateValue(formData[this.formControlNames().date], baseTransaction.date),
      category: selectedCategory
    };

    this.save.emit(editedTransaction);
  }

  private toDateValue(value: unknown, fallback: Date): Date {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? fallback : value;
    }
    const parsed = new Date(String(value ?? ''));
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }
}
