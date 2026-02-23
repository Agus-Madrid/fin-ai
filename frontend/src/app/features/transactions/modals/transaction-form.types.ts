import { FormControl, FormGroup } from '@angular/forms';
import { CreateTransactionRequest } from '../../../shared/models/transaction-create.model';

export interface TransactionFormValue {
  description: string;
  categoryId: string;
  date: string;
  amount: number | null;
}

export interface TransactionFormControls {
  description: FormControl<string>;
  categoryId: FormControl<string>;
  date: FormControl<string>;
  amount: FormControl<number | null>;
}

export type TransactionFormGroup = FormGroup<TransactionFormControls>;

export interface TransactionFormSavePayload {
  request: CreateTransactionRequest;
  transactionId: string | number | null;
}

export const TRANSACTION_FORM_CONTROL_NAMES = {
  description: 'description',
  categoryId: 'categoryId',
  date: 'date',
  amount: 'amount'
} as const;

export type TransactionFormControlNames = typeof TRANSACTION_FORM_CONTROL_NAMES;
