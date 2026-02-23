import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { BudgetVm, FixedExpense, IncomeSource } from '../../../shared/models/budget.model';

@Component({
  selector: 'app-budget-planner-view',
  standalone: true,
  imports: [NgFor, NgClass, CurrencyPipe],
  templateUrl: './budget-planner.view.component.html',
  styleUrl: './budget-planner.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetPlannerViewComponent {
  readonly vm = input.required<BudgetVm>();

  readonly addIncomeRequested = output<void>();
  readonly editIncomeRequested = output<IncomeSource>();
  readonly deleteIncomeRequested = output<IncomeSource>();
  readonly addFixedCommitmentRequested = output<void>();
  readonly editFixedCommitmentRequested = output<FixedExpense>();
  readonly deleteFixedCommitmentRequested = output<FixedExpense>();

  onAddIncomeRequested() {
    this.addIncomeRequested.emit();
  }

  onEditIncomeRequested(income: IncomeSource) {
    this.editIncomeRequested.emit(income);
  }

  onDeleteIncomeRequested(income: IncomeSource) {
    this.deleteIncomeRequested.emit(income);
  }

  onAddFixedCommitmentRequested() {
    this.addFixedCommitmentRequested.emit();
  }

  onEditFixedCommitmentRequested(expense: FixedExpense) {
    this.editFixedCommitmentRequested.emit(expense);
  }

  onDeleteFixedCommitmentRequested(expense: FixedExpense) {
    this.deleteFixedCommitmentRequested.emit(expense);
  }
}
