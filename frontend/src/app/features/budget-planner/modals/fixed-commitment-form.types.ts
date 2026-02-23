import { FormControl, FormGroup } from '@angular/forms';
import { CreateFixedCommitmentRequest } from '../../../shared/models/fixed-commitment-create.model';

export interface FixedCommitmentFormValue {
  name: string;
  description: string;
  amount: number | null;
}

export interface FixedCommitmentFormControls {
  name: FormControl<string>;
  description: FormControl<string>;
  amount: FormControl<number | null>;
}

export type FixedCommitmentFormGroup = FormGroup<FixedCommitmentFormControls>;

export interface FixedCommitmentFormSavePayload {
  request: CreateFixedCommitmentRequest;
  commitmentId: string | null;
}

export const FIXED_COMMITMENT_FORM_CONTROL_NAMES = {
  name: 'name',
  description: 'description',
  amount: 'amount'
} as const;

export type FixedCommitmentFormControlNames = typeof FIXED_COMMITMENT_FORM_CONTROL_NAMES;
