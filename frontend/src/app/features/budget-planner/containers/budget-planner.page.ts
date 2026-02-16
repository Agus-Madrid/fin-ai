import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BudgetDataService } from '../../../core/data/budget-data.service';
import { BudgetPlannerViewComponent } from '../presentational/budget-planner.view.component';

@Component({
  selector: 'app-budget-planner-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, BudgetPlannerViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-budget-planner-view [vm]="vm"></app-budget-planner-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetPlannerPageComponent {
  private readonly data = inject(BudgetDataService);
  readonly vm$ = this.data.getBudgetVm();
}
