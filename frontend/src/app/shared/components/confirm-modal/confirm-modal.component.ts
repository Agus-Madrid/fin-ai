import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to continue?');
  readonly cancelText = input('Cancel');
  readonly confirmText = input('Confirm');
  readonly tone = input<'danger' | 'primary'>('danger');

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
