import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateFixedCommitmentRequest } from '../../../../shared/models/fixed-commitment-create.model';
import { FixedCommitment } from '../../../../shared/models/fixed-commitment.model';
import { parseUruguayNumber } from '../../../../shared/utils/number-format.util';
import {
  FIXED_COMMITMENT_FORM_CONTROL_NAMES,
  FixedCommitmentFormControlNames,
  FixedCommitmentFormGroup,
  FixedCommitmentFormSavePayload,
  FixedCommitmentFormValue
} from '../fixed-commitment-form.types';

@Component({
  selector: 'app-fixed-commitment-form-modal-view',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './fixed-commitment-form-modal.view.component.html',
  styleUrl: './fixed-commitment-form-modal.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FixedCommitmentFormModalViewComponent {
  readonly title = input('Editar gasto fijo');
  readonly subtitle = input('Actualiza los datos del compromiso fijo.');
  readonly saveText = input('Guardar cambios');
  readonly cancelText = input('Cancelar');
  readonly commitment = input<FixedCommitment | null>(null);
  readonly form = input<FixedCommitmentFormGroup | null>(null);

  readonly formControlNames = input<FixedCommitmentFormControlNames>(FIXED_COMMITMENT_FORM_CONTROL_NAMES);

  readonly dismissRequested = output<void>();
  readonly saveRequested = output<FixedCommitmentFormSavePayload>();

  onSave(): void {
    const form = this.form();
    if (!form?.valid) {
      return;
    }

    const formData: FixedCommitmentFormValue = form.getRawValue();
    const { name, description, amount } = formData;
    const parsedAmount = parseUruguayNumber(amount);
    if (!Number.isFinite(parsedAmount)) {
      return;
    }

    const request: CreateFixedCommitmentRequest = {
      name,
      description: description.trim() ? description : undefined,
      amount: parsedAmount
    };

    this.saveRequested.emit({
      request,
      commitmentId: this.commitment()?.id ?? null
    });
  }
}
