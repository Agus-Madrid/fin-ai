import { Injectable } from '@angular/core';
import { BudgetViewModel, IncomeSource } from '../../shared/models/budget.model';
import { Income } from '../../shared/models/income.model';
import { FixedCommitment } from '../../shared/models/fixed-commitment.model';
import { User } from '../../shared/models/user.model';
import { SavingsLog } from '../../shared/models/savings-log.model';
import { SavingGoal } from '../../shared/models/saving-goal.model';

const DEFAULT_INCOME_SOURCE = 'Ingreso manual';
const DEFAULT_FIXED_CATEGORY = 'Compromiso fijo';
const YEAR_MONTH_PERIOD_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

@Injectable({ providedIn: 'root' })
export class BudgetDataService {
  private readonly shortMonthFormatter = new Intl.DateTimeFormat('es-UY', {
    month: 'short'
  });
  private readonly periodLabelFormatter = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
    year: 'numeric'
  });

  buildBudgetViewModel(
    incomes: Income[],
    fixedCommitments: FixedCommitment[],
    user: User | null,
    savingsLogs: SavingsLog[],
    savingGoals: SavingGoal[],
    currentPeriodSavingGoals: SavingGoal[]
  ): BudgetViewModel {
    const incomeSources = incomes.map((income, index) =>
      this.toIncomeSource(income, index)
    );
    const fixedExpenses = fixedCommitments.map((commitment) =>
      this.toFixedExpense(commitment)
    );

    const totalIncome = incomeSources.reduce((sum, income) => sum + income.amount, 0);
    const totalFixed = fixedExpenses.reduce((sum, fixed) => sum + fixed.amount, 0);

    const monthlyGoal = this.normalizeAmount(user?.goalMonthlySavings ?? 0);
    const monthlyGoalPercent = totalIncome > 0
      ? Math.max(0, Math.min(100, (monthlyGoal / totalIncome) * 100))
      : 0;
    const preCommitted = this.normalizeAmount(totalFixed + monthlyGoal);
    const discretionary = Math.max(this.normalizeAmount(totalIncome - preCommitted), 0);
    const remainderPercent = totalIncome > 0
      ? Math.round((discretionary / totalIncome) * 100)
      : 0;
    const preCommittedPercent = totalIncome > 0
      ? Math.max(0, Math.min(100, 100 - remainderPercent))
      : 0;

    const orderedGoals = this.buildSavingGoalsProgress(
      savingGoals,
      this.normalizeAmount(user?.currentTotalSavings ?? 0)
    );
    const orderedCurrentPeriodGoals = this.buildSavingGoalsProgress(
      currentPeriodSavingGoals,
      this.normalizeAmount(user?.currentTotalSavings ?? 0)
    );
    const activeGoal = orderedCurrentPeriodGoals[0] ?? null;
    const currentTotal = this.normalizeAmount(user?.currentTotalSavings ?? 0);
    const goalName = activeGoal?.name?.trim() || 'Meta de ahorro';
    const targetAmount = this.normalizeAmount(activeGoal?.targetAmount ?? 0);
    const progress = targetAmount > 0
      ? Math.max(0, Math.min(100, (currentTotal / targetAmount) * 100))
      : 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentPeriod = this.toPeriod(now);
    const annualLogs = this.buildAnnualLogs(savingsLogs, currentYear);
    const annualConfirmedTotal = annualLogs.reduce((sum, item) => sum + item.confirmedAmount, 0);

    const currentPeriodLog = savingsLogs.find((log) => log.period === currentPeriod);
    const currentPeriodStatus = currentPeriodLog?.status ?? 'PENDING';
    const currentPeriodConfirmedAmount = this.normalizeAmount(currentPeriodLog?.confirmedAmount ?? 0);
    const currentPeriodSuggestedAmount = currentPeriodStatus === 'PENDING'
      ? monthlyGoal
      : currentPeriodConfirmedAmount;

    const projectedMessage = this.buildProjectedMessage(currentTotal, targetAmount, monthlyGoal);

    return {
      currency: 'UYU',
      incomeSources,
      fixedExpenses,
      savingGoals: orderedGoals,
      currentPeriodSavingGoals: orderedCurrentPeriodGoals,
      savings: {
        goalName,
        goalId: activeGoal?.id ?? null,
        monthlyGoal,
        monthlyGoalPercent,
        progress,
        projectedMessage,
        currentTotal,
        targetAmount,
        currentYear,
        currentPeriodLabel: this.periodToLabel(currentPeriod),
        currentPeriodStatus,
        currentPeriodConfirmedAmount,
        currentPeriodSuggestedAmount,
        annualConfirmedTotal,
        annualLogs
      },
      commitments: {
        preCommitted,
        discretionary,
        preCommittedPercent,
        remainderPercent
      },
      totalIncome,
      totalFixed
    };
  }

  private toIncomeSource(income: Income, index: number): IncomeSource {
    const parsedAmount = Number(income.amount);

    return {
      id: income.id,
      label: income.name,
      source: income.description ?? DEFAULT_INCOME_SOURCE,
      amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
      status: 'Confirmado',
      timing: `Actualizado · #${index + 1}`,
      progress: 100
    };
  }

  private toFixedExpense(commitment: FixedCommitment) {
    const parsedAmount = Number(commitment.amount);
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    return {
      id: commitment.id,
      name: commitment.name,
      category: commitment.description ?? DEFAULT_FIXED_CATEGORY,
      amount,
      progress: 100,
      icon: 'bi-receipt'
    };
  }

  private buildSavingGoalsProgress(goals: SavingGoal[], currentTotalSavings: number): BudgetViewModel['savingGoals'] {
    const ordered = [...goals].sort((a, b) => {
      const byPriority = Number(a.priority ?? 1) - Number(b.priority ?? 1);
      if (byPriority !== 0) {
        return byPriority;
      }

      const aDeadline = new Date(a.deadline).getTime();
      const bDeadline = new Date(b.deadline).getTime();
      return aDeadline - bDeadline;
    });

    let remaining = this.normalizeAmount(currentTotalSavings);

    return ordered.map((goal) => {
      const targetAmount = this.normalizeAmount(goal.targetAmount);
      const allocatedAmount = Math.max(0, Math.min(targetAmount, remaining));
      remaining = Math.max(0, this.normalizeAmount(remaining - allocatedAmount));

      const progressPercent = targetAmount > 0
        ? Math.max(0, Math.min(100, (allocatedAmount / targetAmount) * 100))
        : 0;

      return {
        ...goal,
        targetAmount,
        allocatedAmount: this.normalizeAmount(allocatedAmount),
        progressPercent: this.normalizeAmount(progressPercent),
      };
    });
  }

  private buildAnnualLogs(savingsLogs: SavingsLog[], year: number): BudgetViewModel['savings']['annualLogs'] {
    const base = Array.from({ length: 12 }, (_, index) => ({
      monthIndex: index + 1,
      monthLabel: this.getMonthLabel(index),
      confirmedAmount: 0
    }));

    for (const log of savingsLogs) {
      const parsed = this.parsePeriod(log.period);
      if (!parsed || parsed.year !== year) {
        continue;
      }

      const currentAmount = base[parsed.month - 1].confirmedAmount;
      base[parsed.month - 1].confirmedAmount = this.normalizeAmount(
        currentAmount + this.normalizeAmount(log.confirmedAmount)
      );
    }

    return base;
  }

  private buildProjectedMessage(currentTotal: number, targetAmount: number, monthlyGoal: number): string {
    if (monthlyGoal <= 0) {
      return 'Define un objetivo mensual para proyectar tu avance de ahorro.';
    }

    if (targetAmount <= 0) {
      return `Con este ritmo agregas ${this.formatCurrency(monthlyGoal)} por mes a tu ahorro total.`;
    }

    const remaining = Math.max(targetAmount - currentTotal, 0);
    if (remaining <= 0) {
      return 'Objetivo alcanzado. Puedes crear una nueva meta para seguir avanzando.';
    }

    const monthsToGoal = remaining / monthlyGoal;
    const roundedMonths = Math.ceil(monthsToGoal * 10) / 10;
    return `Manteniendo este ritmo completas la meta en aprox. ${roundedMonths} meses.`;
  }

  private periodToLabel(period: string): string {
    const parsed = this.parsePeriod(period);
    if (!parsed) {
      return period;
    }

    const date = new Date(parsed.year, parsed.month - 1, 1);
    const formatted = this.periodLabelFormatter.format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private getMonthLabel(zeroBasedMonth: number): string {
    const label = this.shortMonthFormatter.format(new Date(2026, zeroBasedMonth, 1)).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private parsePeriod(period: string): { year: number; month: number } | null {
    const match = YEAR_MONTH_PERIOD_REGEX.exec(period);
    if (!match) {
      return null;
    }

    return {
      year: Number(match[1]),
      month: Number(match[2])
    };
  }

  private toPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private normalizeAmount(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.round(parsed * 100) / 100;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0
    }).format(value);
  }
}

