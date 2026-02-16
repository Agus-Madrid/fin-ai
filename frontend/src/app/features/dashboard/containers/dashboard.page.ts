import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardDataService } from '../../../core/data/dashboard-data.service';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-dashboard-view [vm]="vm"></app-dashboard-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly data = inject(DashboardDataService);
  readonly vm$ = this.data.getDashboardVm();
}
