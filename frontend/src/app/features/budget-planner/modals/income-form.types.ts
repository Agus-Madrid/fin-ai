import { FormControl, FormGroup } from '@angular/forms';
import { CreateIncomeRequest } from '../../../shared/models/income-create.model';
import { IncomeRuleType } from '../../../shared/models/income.model';

export interface IncomeFormValue {
  name: string;
  description: string;
  amount: number | null;
  ruleType: IncomeRuleType;
  startPeriod: string;
  targetPeriod: string;
}

export interface IncomeFormControls {
  name: FormControl<string>;
  description: FormControl<string>;
  amount: FormControl<number | null>;
  ruleType: FormControl<IncomeRuleType>;
  startPeriod: FormControl<string>;
  targetPeriod: FormControl<string>;
}

export type IncomeFormGroup = FormGroup<IncomeFormControls>;

export interface IncomeFormSavePayload {
  request: CreateIncomeRequest;
  incomeId: string | null;
}

export const INCOME_FORM_CONTROL_NAMES = {
  name: 'name',
  description: 'description',
  amount: 'amount',
  ruleType: 'ruleType',
  startPeriod: 'startPeriod',
  targetPeriod: 'targetPeriod'
} as const;

export type IncomeFormControlNames = typeof INCOME_FORM_CONTROL_NAMES;
