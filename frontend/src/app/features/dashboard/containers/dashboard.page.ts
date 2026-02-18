import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardDataService } from '../../../core/data/dashboard-data.service';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { AppConfigService } from '../../../core/config/app-config.service';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../../shared/models/category.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-dashboard-view
        [vm]="vm"
        [manualTransactionFormGroup]="manualTransactionFormGroup"
        [categories]="categories()"
      ></app-dashboard-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly data = inject(DashboardDataService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(FakeAuthService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly userId = this.auth.ensureUserId();

  readonly manualTransactionFormGroup: FormGroup = this.fb.group({
    amount: [0, Validators.required],
    date: [new Date(), Validators.required],
    description: ['', Validators.required],
    categoryId: ['', Validators.required]
  });

  readonly categoriesResource = resource<Category[], { userId: string; apiBaseUrl: string }>({
    request: () => ({
      userId: this.userId,
      apiBaseUrl: this.config.apiBaseUrl()
    }),
    loader: ({ request }) => {
      const url = joinUrl(request.apiBaseUrl, `/categories/user/${request.userId}`);
      return firstValueFrom(this.http.get<Category[]>(url));
    },
    defaultValue: []
  });

  readonly categories = this.categoriesResource.value;

  readonly vm$ = this.data.getDashboardVm();
}

function joinUrl(base: string, path: string): string {
  if (!base) {
    return path;
  }
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}
