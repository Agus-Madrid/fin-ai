import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginViewComponent } from '../presentational/login.view.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginViewComponent],
  template: `
    <app-login-view
      [loginForm]="loginForm"
      [isSubmitting]="isSubmitting()"
      [errorMessage]="errorMessage()"
      (loginSubmit)="submitLogin()"
    ></app-login-view>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [true]
  });

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const formValue = this.loginForm.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeReturnUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';

    this.authService
      .signIn({
        email: formValue.email,
        password: formValue.password,
        rememberMe: formValue.rememberMe
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(safeReturnUrl);
        },
        error: () => {
          this.errorMessage.set('No se pudo iniciar sesion. Revisa tus credenciales.');
        }
      });
  }
}
