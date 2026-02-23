import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Chart, TooltipItem, registerables } from 'chart.js';
import {
  BudgetViewModel,
  FixedExpense,
  IncomeSource,
  SavingGoalProgress
} from '../../../shared/models/budget.model';
import { CreateSavingGoalRequest } from '../../../shared/models/saving-goal-create.model';

Chart.register(...registerables);

type BudgetPlannerTab = 'monthly' | 'goals';

@Component({
  selector: 'app-budget-planner-view',
  standalone: true,
  imports: [NgFor, NgClass, NgIf, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './budget-planner.view.component.html',
  styleUrl: './budget-planner.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetPlannerViewComponent {
  activeTab: BudgetPlannerTab = 'monthly';
  activeGoalIndex = 0;

  private readonly destroyRef = inject(DestroyRef);
  private readonly savingsLogsChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('savingsLogsChart');
  private readonly currencyFormatter = new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0
  });

  private savingsLogsChart?: Chart<'bar'>;

  readonly budgetViewModel = input.required<BudgetViewModel>();

  readonly addIncomeRequested = output<void>();
  readonly editIncomeRequested = output<IncomeSource>();
  readonly deleteIncomeRequested = output<IncomeSource>();
  readonly addFixedCommitmentRequested = output<void>();
  readonly editFixedCommitmentRequested = output<FixedExpense>();
  readonly deleteFixedCommitmentRequested = output<FixedExpense>();
  readonly createSavingGoalRequested = output<CreateSavingGoalRequest>();
  readonly deleteSavingGoalRequested = output<string>();
  readonly updateMonthlyGoalRequested = output<number>();
  readonly confirmMonthlySavingsRequested = output<number>();
  readonly skipMonthlySavingsRequested = output<void>();

  constructor() {
    this.initializeReactiveViewState();
  }

  private initializeReactiveViewState() {
    effect(() => {
      this.syncSavingsLogsChartToView();
    });

    effect(() => {
      this.syncCurrentGoalIndexToAvailableGoals();
    });

    this.destroyRef.onDestroy(() => {
      this.savingsLogsChart?.destroy();
      this.savingsLogsChart = undefined;
    });
  }

  private syncSavingsLogsChartToView() {
    const canvas = this.savingsLogsChartCanvas()?.nativeElement;
    if (!canvas) {
      this.savingsLogsChart?.destroy();
      this.savingsLogsChart = undefined;
      return;
    }

    this.renderSavingsLogsChart(canvas);
  }

  private syncCurrentGoalIndexToAvailableGoals() {
    const goals = this.getCurrentPeriodSavingGoals();
    if (!goals.length) {
      this.activeGoalIndex = 0;
      return;
    }

    if (this.activeGoalIndex > goals.length - 1) {
      this.activeGoalIndex = goals.length - 1;
    }
  }

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

  setActiveTab(tab: BudgetPlannerTab) {
    this.activeTab = tab;
  }

  onUpdateMonthlyGoalRequested(rawValue: string) {
    const parsed = this.parseNonNegativeAmount(rawValue);
    if (parsed === null) {
      return;
    }

    this.updateMonthlyGoalRequested.emit(parsed);
  }

  onConfirmMonthlySavingsRequested(rawValue: string) {
    const parsed = this.parseNonNegativeAmount(rawValue);
    if (parsed === null) {
      return;
    }

    this.confirmMonthlySavingsRequested.emit(parsed);
  }

  onSkipMonthlySavingsRequested() {
    this.skipMonthlySavingsRequested.emit();
  }

  onCreateSavingGoalRequested(
    name: string,
    targetAmount: string,
    deadline: string,
    priority: string
  ) {
    const cleanName = name.trim();
    const parsedTarget = this.parseNonNegativeAmount(targetAmount);
    const parsedPriority = this.parsePriority(priority);

    if (!cleanName || !deadline || parsedTarget === null || parsedTarget <= 0 || parsedPriority === null) {
      return;
    }

    this.createSavingGoalRequested.emit({
      name: cleanName,
      targetAmount: parsedTarget,
      deadline,
      priority: parsedPriority
    });
  }

  onDeleteSavingGoalRequested(goalId: string) {
    this.deleteSavingGoalRequested.emit(goalId);
  }

  getCurrentPeriodSavingGoals(): SavingGoalProgress[] {
    return this.budgetViewModel().currentPeriodSavingGoals ?? [];
  }

  getActiveCurrentPeriodGoal(): SavingGoalProgress | null {
    const goals = this.getCurrentPeriodSavingGoals();
    if (!goals.length) {
      return null;
    }

    return goals[this.activeGoalIndex] ?? goals[0];
  }

  hasMultipleCurrentPeriodGoals(): boolean {
    return this.getCurrentPeriodSavingGoals().length > 1;
  }

  getCurrentPeriodGoalsCounterLabel(): string {
    const goals = this.getCurrentPeriodSavingGoals();
    if (!goals.length) {
      return '0/0';
    }

    return `${this.activeGoalIndex + 1}/${goals.length}`;
  }

  goToPreviousCurrentPeriodGoal() {
    const goals = this.getCurrentPeriodSavingGoals();
    if (goals.length <= 1) {
      return;
    }

    this.activeGoalIndex = this.activeGoalIndex === 0
      ? goals.length - 1
      : this.activeGoalIndex - 1;
  }

  goToNextCurrentPeriodGoal() {
    const goals = this.getCurrentPeriodSavingGoals();
    if (goals.length <= 1) {
      return;
    }

    this.activeGoalIndex = this.activeGoalIndex === goals.length - 1
      ? 0
      : this.activeGoalIndex + 1;
  }

  getCurrentPeriodStatusLabel(): string {
    const status = this.budgetViewModel().savings.currentPeriodStatus;
    if (status === 'CONFIRMED') {
      return 'Confirmado';
    }
    if (status === 'SKIPPED') {
      return 'Omitido';
    }
    return 'Pendiente';
  }

  getFixedIncomePercentLabel(): string {
    const income = this.budgetViewModel().totalIncome;
    if (income <= 0) {
      return '0.0%';
    }

    const percent = (this.budgetViewModel().totalFixed / income) * 100;
    return `${percent.toFixed(1)}%`;
  }

  private parseNonNegativeAmount(rawValue: string): number | null {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.round(parsed * 100) / 100;
  }

  private parsePriority(rawValue: string): number | null {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  private renderSavingsLogsChart(canvas: HTMLCanvasElement) {
    const points = this.budgetViewModel().savings.annualLogs;
    const theme = this.getThemeColors();

    this.savingsLogsChart?.destroy();

    this.savingsLogsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: points.map((point) => point.monthLabel),
        datasets: [
          {
            label: 'Ahorro confirmado',
            data: points.map((point) => point.confirmedAmount),
            backgroundColor: theme.barFill,
            borderColor: theme.barBorder,
            borderWidth: 1.5,
            borderRadius: 8,
            hoverBackgroundColor: theme.barFillHover,
            maxBarThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: 'easeOutCubic'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: theme.tooltipSurface,
            borderColor: theme.border,
            borderWidth: 1,
            titleColor: theme.text,
            bodyColor: theme.text,
            callbacks: {
              label: (context: TooltipItem<'bar'>) =>
                `Confirmado: ${this.currencyFormatter.format(context.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: theme.muted
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(125, 125, 134, 0.16)'
            },
            ticks: {
              color: theme.muted,
              callback: (value) => this.currencyFormatter.format(Number(value))
            }
          }
        }
      }
    });
  }

  private getThemeColors() {
    if (typeof window === 'undefined') {
      return {
        text: '#f5f5f5',
        muted: '#a1a1aa',
        border: '#2e2e2e',
        tooltipSurface: '#151921',
        barFill: 'rgba(37, 99, 235, 0.45)',
        barFillHover: 'rgba(59, 130, 246, 0.62)',
        barBorder: '#60a5fa'
      };
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const readVar = (name: string, fallback: string) =>
      rootStyle.getPropertyValue(name).trim() || fallback;

    return {
      text: readVar('--app-text', '#f5f5f5'),
      muted: readVar('--app-muted', '#a1a1aa'),
      border: readVar('--app-border', '#2e2e2e'),
      tooltipSurface: '#151921',
      barFill: 'rgba(37, 99, 235, 0.45)',
      barFillHover: 'rgba(59, 130, 246, 0.62)',
      barBorder: '#60a5fa'
    };
  }
}

