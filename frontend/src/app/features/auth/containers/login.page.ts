import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { LoginViewComponent } from '../presentational/login.view.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginViewComponent],
  template: `
    <app-login-view
      [loginForm]="loginForm"
      [isSubmitting]="isSubmitting()"
      (loginSubmit)="submitLogin()"
    ></app-login-view>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(FakeAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true]
  });

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.loginForm.getRawValue();

    this.authService.signIn({
      email: formValue.email,
      password: formValue.password,
      rememberMe: formValue.rememberMe
    });

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeReturnUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';

    void this.router.navigateByUrl(safeReturnUrl).finally(() => {
      this.isSubmitting.set(false);
    });
  }
}
