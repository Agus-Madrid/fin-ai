import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Income } from '../../../../shared/models/income.model';
import {
  INCOME_FORM_CONTROL_NAMES,
  IncomeFormControlNames,
  IncomeFormGroup,
  IncomeFormSavePayload
} from '../income-form.types';
import { IncomeFormModalViewComponent } from '../presentational/income-form-modal.view.component';

@Component({
  selector: 'app-income-form-modal',
  standalone: true,
  imports: [IncomeFormModalViewComponent],
  template: `
    <app-income-form-modal-view
      [title]="title"
      [subtitle]="subtitle"
      [saveText]="saveText"
      [cancelText]="cancelText"
      [income]="income"
      [form]="form"
      [formControlNames]="formControlNames"
      (saveRequested)="onSave($event)"
      (dismissRequested)="dismissRequested.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomeFormModalContainerComponent {
  readonly saveRequested = output<IncomeFormSavePayload>();
  readonly dismissRequested = output<void>();

  income: Income | null = null;
  form: IncomeFormGroup | null = null;

  formControlNames: IncomeFormControlNames = INCOME_FORM_CONTROL_NAMES;

  get title(): string {
    return this.income ? 'Editar ingreso' : 'Nuevo ingreso';
  }

  get subtitle(): string {
    return this.income
      ? 'Actualiza los datos del ingreso.'
      : 'Carga los datos para registrar un nuevo ingreso.';
  }

  get saveText(): string {
    return this.income ? 'Guardar cambios' : 'Crear ingreso';
  }

  get cancelText(): string {
    return 'Cancelar';
  }

  onSave(event: IncomeFormSavePayload): void {
    this.saveRequested.emit(event);
  }
}
