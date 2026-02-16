import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { BudgetVm } from '../../../shared/models/budget.model';

@Component({
  selector: 'app-budget-planner-view',
  standalone: true,
  imports: [NgFor, NgClass, CurrencyPipe],
  templateUrl: './budget-planner.view.component.html',
  styleUrl: './budget-planner.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetPlannerViewComponent {
  @Input({ required: true }) vm!: BudgetVm;
}
