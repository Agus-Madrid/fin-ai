import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FixedCommitment } from '../../../../shared/models/fixed-commitment.model';
import {
  FIXED_COMMITMENT_FORM_CONTROL_NAMES,
  FixedCommitmentFormControlNames,
  FixedCommitmentFormGroup,
  FixedCommitmentFormSavePayload
} from '../fixed-commitment-form.types';
import { FixedCommitmentFormModalViewComponent } from '../presentational/fixed-commitment-form-modal.view.component';

@Component({
  selector: 'app-fixed-commitment-form-modal',
  standalone: true,
  imports: [FixedCommitmentFormModalViewComponent],
  template: `
    <app-fixed-commitment-form-modal-view
      [title]="title"
      [subtitle]="subtitle"
      [saveText]="saveText"
      [cancelText]="cancelText"
      [commitment]="commitment"
      [form]="form"
      [formControlNames]="formControlNames"
      (saveRequested)="onSave($event)"
      (dismissRequested)="dismissRequested.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FixedCommitmentFormModalContainerComponent {
  readonly saveRequested = output<FixedCommitmentFormSavePayload>();
  readonly dismissRequested = output<void>();

  commitment: FixedCommitment | null = null;
  form: FixedCommitmentFormGroup | null = null;

  formControlNames: FixedCommitmentFormControlNames = FIXED_COMMITMENT_FORM_CONTROL_NAMES;

  get title(): string {
    return this.commitment ? 'Editar gasto fijo' : 'Nuevo gasto fijo';
  }

  get subtitle(): string {
    return this.commitment
      ? 'Actualiza los datos del compromiso fijo.'
      : 'Carga los datos para registrar un compromiso fijo.';
  }

  get saveText(): string {
    return this.commitment ? 'Guardar cambios' : 'Crear gasto fijo';
  }

  get cancelText(): string {
    return 'Cancelar';
  }

  onSave(event: FixedCommitmentFormSavePayload): void {
    this.saveRequested.emit(event);
  }
}
