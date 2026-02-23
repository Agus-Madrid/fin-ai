import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  ResourceRef,
  viewChild
} from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, ScriptableContext, TooltipItem, registerables } from 'chart.js';
import { Category } from '../../../shared/models/category.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';
import { SavingGoal } from '../../../shared/models/saving-goal.model';
import { User } from '../../../shared/models/user.model';

Chart.register(...registerables);

type CategorySpend = { category: Category; amount: number };

interface DashboardThemeColors {
  primary: string;
  text: string;
  muted: string;
  border: string;
  surfaceChart: string;
  surfaceTooltip: string;
  mutedTrack: string;
}

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, DecimalPipe, ReactiveFormsModule, SlicePipe],
  templateUrl: './dashboard.view.component.html',
  styleUrl: './dashboard.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardViewComponent {
  TransactionStatus = TransactionStatus;
  private readonly locale = 'es-UY';
  private readonly destroyRef = inject(DestroyRef);
  private readonly compactNumberFormatter = new Intl.NumberFormat(this.locale, {
    notation: 'compact',
    maximumFractionDigits: 1
  });
  private readonly currencyFormatter = new Intl.NumberFormat(this.locale, {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0
  });
  private readonly percentFormatter = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  private readonly trendDateFormatter = new Intl.DateTimeFormat(this.locale, {
    day: '2-digit',
    month: 'short'
  });
  private readonly goalDeadlineFormatter = new Intl.DateTimeFormat(this.locale, {
    month: 'short',
    year: 'numeric'
  });

  private readonly categoryChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('categoryChart');
  private readonly trendChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendChart');

  private categoryChart?: Chart<'doughnut'>;
  private trendChart?: Chart<'line'>;

  readonly transactions = input.required<ResourceRef<Transaction[]>>();
  readonly transactionCategories = input.required<CategorySpend[]>();
  readonly user = input.required<User>();
  readonly totalIncome = input(0);
  readonly totalFixedExpenses = input(0);
  readonly fixedExpensePercent = input(0);
  readonly spendableBalance = input(0);
  readonly spendablePercent = input(0);
  readonly manualTransactionFormGroup = input<FormGroup>();
  readonly categories = input<Category[]>([]);
  readonly submitTransaction = output<void>();

  constructor() {
    effect(() => {
      const categoryCanvas = this.categoryChartCanvas()?.nativeElement;
      const trendCanvas = this.trendChartCanvas()?.nativeElement;
      if (!categoryCanvas || !trendCanvas) {
        return;
      }

      const categories = this.transactionCategories() ?? [];
      const transactions = this.transactions().value() ?? [];

      this.renderCategoryChart(categoryCanvas, categories);
      this.renderTrendChart(trendCanvas, transactions);
    });

    this.destroyRef.onDestroy(() => this.destroyCharts());
  }

  getSpendableLabel() {
    return 'Dinero Gastable';
  }

  getSpendableChipClass(): string {
    return this.spendablePercent() >= 0 ? 'app-chip--success' : 'app-chip--danger';
  }

  getSpendableIconClass(): string {
    return this.spendablePercent() >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }

  getSpendablePercentLabel(): string {
    const absolute = Math.abs(this.spendablePercent());
    return `${this.percentFormatter.format(absolute)}%`;
  }

  getTotalCategoryAmount(): number {
    const items = this.transactionCategories() ?? [];
    return items.reduce((sum, item) => sum + item.amount, 0);
  }

  getTotalCategoryAmountLabel(): string {
    return `$${this.compactNumberFormatter.format(this.getTotalCategoryAmount())}`;
  }

  getCategoryPercent(amount: number): number {
    const total = this.getTotalCategoryAmount();
    if (total <= 0) {
      return 0;
    }
    return (amount / total) * 100;
  }

  getPrimarySavingGoal(): SavingGoal | null {
    const savingGoals = this.user().savingGoals ?? [];
    if (!savingGoals.length) {
      return null;
    }

    return [...savingGoals].sort((a, b) => {
      const byPriority = Number(a.priority ?? 1) - Number(b.priority ?? 1);
      if (byPriority !== 0) {
        return byPriority;
      }

      const aDeadline = new Date(a.deadline).getTime();
      const bDeadline = new Date(b.deadline).getTime();
      return aDeadline - bDeadline;
    })[0] ?? null;
  }

  getSavingGoalProgressPercent(): number {
    const savingGoal = this.getPrimarySavingGoal();
    if (!savingGoal) {
      return 0;
    }

    const targetAmount = Number(savingGoal.targetAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return 0;
    }

    const currentTotalSavings = Number(this.user().currentTotalSavings);
    if (!Number.isFinite(currentTotalSavings) || currentTotalSavings <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (currentTotalSavings / targetAmount) * 100));
  }

  getSavingGoalProjectionLabel(): string {
    const savingGoal = this.getPrimarySavingGoal();
    if (!savingGoal) {
      return 'Proyección: sin meta';
    }

    const deadline = new Date(savingGoal.deadline);
    if (Number.isNaN(deadline.getTime())) {
      return 'Proyección: sin fecha válida';
    }

    const formattedDeadline = this.goalDeadlineFormatter.format(deadline);
    return `Proyección: ${formattedDeadline}`;
  }

  private renderCategoryChart(canvas: HTMLCanvasElement, categoryItems: CategorySpend[]) {
    const colors = this.getThemeColors();
    const hasData = categoryItems.length > 0;
    const labels = hasData ? categoryItems.map((item) => item.category.name) : ['Sin datos'];
    const data = hasData ? categoryItems.map((item) => Math.abs(item.amount)) : [1];
    const backgroundColor = hasData
      ? categoryItems.map((item) => item.category.color || colors.primary)
      : [colors.mutedTrack];

    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = undefined;
    }

    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderColor: colors.surfaceChart,
            borderWidth: hasData ? 2 : 0,
            hoverBorderColor: colors.surfaceTooltip,
            hoverOffset: 10,
            spacing: hasData ? 2 : 0,
            borderRadius: hasData ? 6 : 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1250,
          easing: 'easeOutExpo'
        },
        cutout: '72%',
        layout: {
          padding: 6
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: hasData,
            backgroundColor: colors.surfaceTooltip,
            borderColor: colors.border,
            borderWidth: 1,
            titleColor: colors.text,
            bodyColor: colors.text,
            displayColors: true,
            callbacks: {
              label: (context) => this.getCategoryTooltipLabel(context)
            }
          }
        }
      }
    });
  }

  private renderTrendChart(canvas: HTMLCanvasElement, transactions: Transaction[]) {
    const colors = this.getThemeColors();
    const trendSeries = this.buildTrendSeries(transactions);

    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = undefined;
    }

    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trendSeries.labels,
        datasets: [
          {
            label: 'Gasto',
            data: trendSeries.values,
            borderColor: colors.primary,
            backgroundColor: (context: ScriptableContext<'line'>) =>
              this.getLineChartGradient(context, colors.primary),
            fill: true,
            tension: 0.42,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#d6e1ff',
            pointHoverBackgroundColor: '#ffffff',
            pointBorderColor: colors.surfaceChart,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1300,
          easing: 'easeOutCubic'
        },
        animations: {
          tension: {
            duration: 900,
            easing: 'easeOutCubic',
            from: 0.95,
            to: 0.42
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: colors.muted
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(125, 125, 134, 0.16)'
            },
            ticks: {
              color: colors.muted,
              callback: (value) => this.currencyFormatter.format(Number(value))
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: colors.surfaceTooltip,
            borderColor: colors.border,
            borderWidth: 1,
            titleColor: colors.text,
            bodyColor: colors.text,
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'line'>) =>
                `Gasto: ${this.currencyFormatter.format(context.parsed.y ?? 0)}`
            }
          }
        }
      }
    });
  }

  private getCategoryTooltipLabel(context: TooltipItem<'doughnut'>): string {
    const label = context.label ? `${context.label}: ` : '';
    return `${label}${this.currencyFormatter.format(Number(context.raw) || 0)}`;
  }

  private getLineChartGradient(context: ScriptableContext<'line'>, color: string): string | CanvasGradient {
    const { chart } = context;
    const { ctx, chartArea } = chart;
    if (!chartArea) {
      return this.toRgba(color, 0.24);
    }

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, this.toRgba(color, 0.36));
    gradient.addColorStop(1, this.toRgba(color, 0.02));
    return gradient;
  }

  private buildTrendSeries(transactions: Transaction[]): { labels: string[]; values: number[] } {
    if (!transactions.length) {
      return {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        values: [0, 0, 0, 0]
      };
    }

    const spendByDay = new Map<string, number>();
    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const spendAmount = Math.abs(Number(transaction.amount) || 0);
      if (spendAmount <= 0) {
        continue;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      spendByDay.set(key, (spendByDay.get(key) ?? 0) + spendAmount);
    }

    const series = Array.from(spendByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);

    if (!series.length) {
      return {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        values: [0, 0, 0, 0]
      };
    }

    return {
      labels: series.map(([dateValue]) => this.trendDateFormatter.format(new Date(`${dateValue}T00:00:00`))),
      values: series.map(([, amount]) => Number(amount.toFixed(2)))
    };
  }

  private getThemeColors(): DashboardThemeColors {
    if (typeof window === 'undefined') {
      return {
        primary: '#2b6cee',
        text: '#f5f5f5',
        muted: '#a1a1aa',
        border: '#2e2e2e',
        surfaceChart: '#0d1118',
        surfaceTooltip: '#151921',
        mutedTrack: '#3f3f46'
      };
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const readVar = (name: string, fallback: string) => rootStyle.getPropertyValue(name).trim() || fallback;

    return {
      primary: readVar('--app-primary', '#2b6cee'),
      text: readVar('--app-text', '#f5f5f5'),
      muted: readVar('--app-muted', '#a1a1aa'),
      border: readVar('--app-border', '#2e2e2e'),
      surfaceChart: '#0d1118',
      surfaceTooltip: '#151921',
      mutedTrack: '#3f3f46'
    };
  }

  private toRgba(color: string, alpha: number): string {
    const hex = color.replace('#', '').trim();

    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return color;
  }

  private destroyCharts() {
    this.categoryChart?.destroy();
    this.trendChart?.destroy();
    this.categoryChart = undefined;
    this.trendChart = undefined;
  }

  onSubmit() {
    this.submitTransaction.emit();
  }
}
