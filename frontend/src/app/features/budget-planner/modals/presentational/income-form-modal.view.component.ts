import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateIncomeRequest } from '../../../../shared/models/income-create.model';
import { Income, IncomeRuleType } from '../../../../shared/models/income.model';
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
    const { name, description, amount, ruleType, startPeriod, targetPeriod } = formData;
    const parsedAmount = parseUruguayNumber(amount);
    if (!Number.isFinite(parsedAmount)) {
      return;
    }

    const normalizedRuleType: IncomeRuleType =
      ruleType === 'ONE_TIME' ? 'ONE_TIME' : 'MONTHLY_RECURRING';
    const normalizedStartPeriod = this.normalizeMonthPeriod(startPeriod);
    const normalizedTargetPeriod = this.normalizeMonthPeriod(targetPeriod);
    if (normalizedRuleType === 'MONTHLY_RECURRING' && !normalizedStartPeriod) {
      return;
    }

    if (normalizedRuleType === 'ONE_TIME' && !normalizedTargetPeriod) {
      return;
    }

    const request: CreateIncomeRequest = {
      name,
      description: description.trim() ? description : undefined,
      amount: parsedAmount,
      ruleType: normalizedRuleType,
      startPeriod:
        normalizedRuleType === 'MONTHLY_RECURRING' ? normalizedStartPeriod : null,
      targetPeriod: normalizedRuleType === 'ONE_TIME' ? normalizedTargetPeriod : null
    };

    this.saveRequested.emit({
      request,
      incomeId: this.income()?.id ?? null
    });
  }

  isRecurringRuleSelected(): boolean {
    const form = this.form();
    if (!form) {
      return true;
    }
    const selectedRuleType = form.get(this.formControlNames().ruleType)?.value;
    return selectedRuleType !== 'ONE_TIME';
  }

  private normalizeMonthPeriod(rawValue: unknown): string | null {
    if (typeof rawValue !== 'string') {
      return null;
    }

    const trimmedValue = rawValue.trim();
    if (!trimmedValue) {
      return null;
    }

    return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmedValue) ? trimmedValue : null;
  }
}
