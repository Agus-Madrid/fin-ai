import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TransactionFormModalViewComponent } from '../presentational/transaction-form-modal.view.component';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';
import {
  TRANSACTION_FORM_CONTROL_NAMES,
  TransactionFormControlNames,
  TransactionFormSavePayload,
  TransactionFormGroup
} from '../transaction-form.types';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [TransactionFormModalViewComponent],
  template: `
    <app-transaction-form-modal-view
      [title]="title"
      [subtitle]="subtitle"
      [saveText]="saveText"
      [cancelText]="cancelText"
      [categories]="categories"
      [transaction]="transaction"
      [form]="form"
      [formControlNames]="formControlNames"
      (saveRequested)="onSave($event)"
      (dismissRequested)="dismissRequested.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFormModalContainerComponent {
  readonly saveRequested = output<TransactionFormSavePayload>();
  readonly dismissRequested = output<void>();

  categories: Category[] = [];
  transaction: Transaction | null = null;
  form: TransactionFormGroup | null = null;

  formControlNames: TransactionFormControlNames = TRANSACTION_FORM_CONTROL_NAMES;

  get title(): string {
    return this.transaction ? 'Editar gasto' : 'Nuevo gasto';
  }

  get subtitle(): string {
    return this.transaction
      ? 'Actualiza los datos de la transaccion confirmada.'
      : 'Carga los datos para crear un nuevo gasto.';
  }

  get saveText(): string {
    return this.transaction ? 'Guardar cambios' : 'Crear gasto';
  }

  get cancelText(): string {
    return 'Cancelar';
  }

  onSave(event: TransactionFormSavePayload): void {
    this.saveRequested.emit(event);
  }
}
