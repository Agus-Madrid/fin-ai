import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-view',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './login.view.component.html',
  styleUrl: './login.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginViewComponent {
  readonly loginForm = input.required<FormGroup>();
  readonly isSubmitting = input(false);
  readonly loginSubmit = output<void>();

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm().get(controlName);
    return Boolean(control?.hasError(errorName) && (control.dirty || control.touched));
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.loginForm().get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    this.loginSubmit.emit();
  }
}
