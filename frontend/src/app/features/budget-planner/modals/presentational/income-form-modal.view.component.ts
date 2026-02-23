import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateIncomeRequest } from '../../../../shared/models/income-create.model';
import { Income } from '../../../../shared/models/income.model';
import { parseUruguayNumber } from '../../../../shared/utils/number-format.util';
import {
  INCOME_FORM_CONTROL_NAMES,
  IncomeFormControlNames,
  IncomeFormGroup,
  IncomeFormSavePayload,
  IncomeFormValue
} from '../income-form.types';

@Component({
  selector: 'app-income-form-modal-view',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './income-form-modal.view.component.html',
  styleUrl: './income-form-modal.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomeFormModalViewComponent {
  readonly title = input('Editar ingreso');
  readonly subtitle = input('Actualiza los datos del ingreso.');
  readonly saveText = input('Guardar cambios');
  readonly cancelText = input('Cancelar');
  readonly income = input<Income | null>(null);
  readonly form = input<IncomeFormGroup | null>(null);

  readonly formControlNames = input<IncomeFormControlNames>(INCOME_FORM_CONTROL_NAMES);

  readonly dismissRequested = output<void>();
  readonly saveRequested = output<IncomeFormSavePayload>();

  onSave(): void {
    const form = this.form();
    if (!form?.valid) {
      return;
    }

    const formData: IncomeFormValue = form.getRawValue();
    const { name, description, amount } = formData;
    const parsedAmount = parseUruguayNumber(amount);
    if (!Number.isFinite(parsedAmount)) {
      return;
    }

    const request: CreateIncomeRequest = {
      name,
      description: description.trim() ? description : undefined,
      amount: parsedAmount
    };

    this.saveRequested.emit({
      request,
      incomeId: this.income()?.id ?? null
    });
  }
}
