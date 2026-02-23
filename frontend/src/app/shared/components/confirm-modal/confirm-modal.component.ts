import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent {
  title = 'Confirm action';
  message = 'Are you sure you want to continue?';
  cancelText = 'Cancel';
  confirmText = 'Confirm';
  tone: 'danger' | 'primary' = 'danger';

  readonly dismissRequested = output<void>();
  readonly confirmRequested = output<void>();
}
