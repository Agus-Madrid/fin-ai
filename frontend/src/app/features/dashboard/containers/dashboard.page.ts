import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardDataService } from '../../../core/data/dashboard-data.service';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-dashboard-view [vm]="vm" [manualTransactionFormGroup]="manualTransactionFormGroup"></app-dashboard-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly data = inject(DashboardDataService);
  private readonly fb = inject(FormBuilder);

  readonly manualTransactionFormGroup: FormGroup = this.fb.group({
    amount: [0, Validators.required],
    date: [new Date(), Validators.required],
    description: ['', Validators.required],
    categoryId: ['', Validators.required]
  });

  readonly vm$ = this.data.getDashboardVm();
}
