import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';

Chart.register(...registerables);

type SpendHistoryMode = 'REGISTERED' | 'CONSUMED';
type SpendHistoryRangeMonths = 3 | 6 | 12 | 24;

interface MonthlySpendRow {
  period: string;
  label: string;
  total: number;
  transactionsCount: number;
}

@Component({
  selector: 'app-transactions-history-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, RouterLink],
  templateUrl: './transactions-history.page.html',
  styleUrl: './transactions-history.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsHistoryPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly transactionService = inject(TransactionService);
  private readonly periodLabelFormatter = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
    year: 'numeric',
  });
  private readonly historyChartCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('historyChartCanvas');

  private historyChart?: Chart<'bar'>;

  readonly historyMode = signal<SpendHistoryMode>('REGISTERED');
  readonly historyRangeMonths = signal<SpendHistoryRangeMonths>(12);
  readonly transactionsResource = this.transactionService.getTransactionsByStatus(
    TransactionStatus.CONFIRMED,
  );
  readonly monthlyRows = computed(() =>
    this.buildMonthlyRows(
      this.transactionsResource.value() ?? [],
      this.historyMode(),
    ),
  );
  readonly filteredMonthlyRows = computed(() =>
    this.monthlyRows().slice(0, this.historyRangeMonths()),
  );

  constructor() {
    effect(() => {
      this.renderHistoryChart();
    });

    this.destroyRef.onDestroy(() => {
      this.historyChart?.destroy();
      this.historyChart = undefined;
    });
  }

  setHistoryMode(mode: SpendHistoryMode): void {
    if (this.historyMode() === mode) {
      return;
    }
    this.historyMode.set(mode);
  }

  getHistoryModeSubtitle(): string {
    return this.historyMode() === 'REGISTERED'
      ? 'Vista por fecha de registro/carga (createdAt).'
      : 'Vista por fecha real de consumo (date).';
  }

  setHistoryRangeMonths(rangeMonths: SpendHistoryRangeMonths): void {
    if (this.historyRangeMonths() === rangeMonths) {
      return;
    }

    this.historyRangeMonths.set(rangeMonths);
  }

  isHistoryRangeSelected(rangeMonths: SpendHistoryRangeMonths): boolean {
    return this.historyRangeMonths() === rangeMonths;
  }

  private renderHistoryChart(): void {
    const canvas = this.historyChartCanvas()?.nativeElement;
    if (!canvas) {
      this.historyChart?.destroy();
      this.historyChart = undefined;
      return;
    }

    const rows = this.filteredMonthlyRows();
    const chronologicalRows = [...rows].reverse();
    const labels = chronologicalRows.map((row) => row.label);
    const values = chronologicalRows.map((row) => row.total);

    this.historyChart?.destroy();
    this.historyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Gasto total',
            data: values,
            borderRadius: 8,
            backgroundColor: 'rgba(43, 108, 238, 0.42)',
            borderColor: '#5f8ef2',
            borderWidth: 1.5,
            hoverBackgroundColor: 'rgba(43, 108, 238, 0.6)',
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 650,
          easing: 'easeOutCubic',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `Gasto: ${new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: 'UYU',
                  maximumFractionDigits: 0,
                }).format(context.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: 'UYU',
                  maximumFractionDigits: 0,
                }).format(Number(value)),
            },
          },
        },
      },
    });
  }

  private buildMonthlyRows(
    transactions: Transaction[],
    mode: SpendHistoryMode,
  ): MonthlySpendRow[] {
    const monthlyRowsByPeriod = new Map<string, MonthlySpendRow>();

    for (const transaction of transactions) {
      const referenceDate = this.resolveReferenceDate(transaction, mode);
      if (!referenceDate) {
        continue;
      }

      const amount = Math.abs(Number(transaction.amount) || 0);
      if (amount <= 0) {
        continue;
      }

      const period = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
      const currentRow = monthlyRowsByPeriod.get(period);
      if (currentRow) {
        currentRow.total = this.normalizeAmount(currentRow.total + amount);
        currentRow.transactionsCount += 1;
        continue;
      }

      monthlyRowsByPeriod.set(period, {
        period,
        label: this.formatPeriodLabel(period),
        total: this.normalizeAmount(amount),
        transactionsCount: 1,
      });
    }

    return Array.from(monthlyRowsByPeriod.values())
      .sort((left, right) => right.period.localeCompare(left.period));
  }

  private resolveReferenceDate(
    transaction: Transaction,
    mode: SpendHistoryMode,
  ): Date | null {
    const rawDate =
      mode === 'REGISTERED'
        ? transaction.createdAt ?? transaction.date
        : transaction.date;

    const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private formatPeriodLabel(period: string): string {
    const [rawYear, rawMonth] = period.split('-');
    const year = Number(rawYear);
    const month = Number(rawMonth);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return period;
    }

    const label = this.periodLabelFormatter.format(new Date(year, month - 1, 1));
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
  }

  private normalizeAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
