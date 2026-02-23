import { FormControl, FormGroup } from '@angular/forms';
import { CreateIncomeRequest } from '../../../shared/models/income-create.model';

export interface IncomeFormValue {
  name: string;
  description: string;
  amount: number | null;
}

export interface IncomeFormControls {
  name: FormControl<string>;
  description: FormControl<string>;
  amount: FormControl<number | null>;
}

export type IncomeFormGroup = FormGroup<IncomeFormControls>;

export interface IncomeFormSavePayload {
  request: CreateIncomeRequest;
  incomeId: string | null;
}

export const INCOME_FORM_CONTROL_NAMES = {
  name: 'name',
  description: 'description',
  amount: 'amount'
} as const;

export type IncomeFormControlNames = typeof INCOME_FORM_CONTROL_NAMES;
