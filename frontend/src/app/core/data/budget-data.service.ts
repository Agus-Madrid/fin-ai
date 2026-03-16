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
    const currentPeriodPlannedAmount = this.normalizeAmount(
      currentPeriodLog?.monthlyGoalSnapshot ?? monthlyGoal
    );
    const currentPeriodConfirmedAmount = this.normalizeAmount(currentPeriodLog?.confirmedAmount ?? 0);
    const currentPeriodShortfallAmount = currentPeriodStatus === 'CONFIRMED'
      ? Math.max(
          this.normalizeAmount(currentPeriodPlannedAmount - currentPeriodConfirmedAmount),
          0
        )
      : 0;
    const currentPeriodSuggestedAmount = currentPeriodStatus === 'PENDING'
      ? monthlyGoal
      : currentPeriodConfirmedAmount;
    const savingsCommitted = this.resolveSavingsCommittedForPeriod(
      currentPeriodStatus,
      currentPeriodConfirmedAmount
    );
    const preCommitted = this.normalizeAmount(totalFixed + savingsCommitted.amount);
    const discretionary = Math.max(this.normalizeAmount(totalIncome - preCommitted), 0);
    const remainderPercent = totalIncome > 0
      ? Math.round((discretionary / totalIncome) * 100)
      : 0;
    const preCommittedPercent = totalIncome > 0
      ? Math.max(0, Math.min(100, 100 - remainderPercent))
      : 0;

    const discipline = this.buildDisciplineMetrics(
      savingsLogs,
      currentPeriod,
      monthlyGoal,
      user?.createdAt ?? null
    );
    const alerts = this.buildSavingsAlerts({
      savingsLogs,
      currentPeriod,
      currentPeriodStatus,
      currentPeriodPlannedAmount,
      currentPeriodShortfallAmount,
      currentTotal,
      targetAmount,
      activeGoalDeadline: activeGoal?.deadline ?? null,
      userCreatedAt: user?.createdAt ?? null
    });
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
        currentPeriodPlannedAmount,
        currentPeriodConfirmedAmount,
        currentPeriodShortfallAmount,
        currentPeriodSuggestedAmount,
        discipline,
        alerts,
        annualConfirmedTotal,
        annualLogs
      },
      commitments: {
        preCommitted,
        discretionary,
        preCommittedPercent,
        remainderPercent,
        savingsCommittedAmount: savingsCommitted.amount,
        savingsCommittedType: savingsCommitted.type
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

  private resolveSavingsCommittedForPeriod(
    currentPeriodStatus: BudgetViewModel['savings']['currentPeriodStatus'],
    currentPeriodConfirmedAmount: number
  ): { amount: number; type: BudgetViewModel['commitments']['savingsCommittedType'] } {
    if (currentPeriodStatus === 'CONFIRMED') {
      return {
        amount: this.normalizeAmount(currentPeriodConfirmedAmount),
        type: 'CONFIRMED'
      };
    }

    if (currentPeriodStatus === 'SKIPPED') {
      return {
        amount: this.normalizeAmount(currentPeriodConfirmedAmount),
        type: 'SKIPPED'
      };
    }

    return {
      amount: this.normalizeAmount(currentPeriodConfirmedAmount),
      type: 'PENDING'
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

  private buildDisciplineMetrics(
    savingsLogs: SavingsLog[],
    currentPeriod: string,
    fallbackMonthlyGoal: number,
    userCreatedAt: Date | string | null
  ): BudgetViewModel['savings']['discipline'] {
    const periodMap = this.buildSavingsLogMap(savingsLogs);
    const closedPeriods = this.buildClosedPeriodsSinceDate(
      currentPeriod,
      userCreatedAt
    );

    if (!closedPeriods.length) {
      return {
        score: 0,
        evaluatedMonths: 0,
        metMonths: 0,
        partialMonths: 0,
        skippedMonths: 0,
        targetHitStreak: 0
      };
    }

    let ratioSum = 0;
    let metMonths = 0;
    let partialMonths = 0;
    let skippedMonths = 0;
    let targetHitStreak = 0;
    let streakActive = true;

    for (const period of closedPeriods) {
      const outcome = this.evaluateSavingsPeriodOutcome(
        periodMap.get(period),
        fallbackMonthlyGoal
      );

      ratioSum += outcome.ratio;

      if (outcome.kind === 'MET') {
        metMonths += 1;
        if (streakActive) {
          targetHitStreak += 1;
        }
      } else if (outcome.kind === 'PARTIAL') {
        partialMonths += 1;
        streakActive = false;
      } else {
        skippedMonths += 1;
        streakActive = false;
      }
    }

    const score = this.normalizeAmount((ratioSum / closedPeriods.length) * 100);

    return {
      score,
      evaluatedMonths: closedPeriods.length,
      metMonths,
      partialMonths,
      skippedMonths,
      targetHitStreak
    };
  }

  private buildSavingsAlerts(params: {
    savingsLogs: SavingsLog[];
    currentPeriod: string;
    currentPeriodStatus: BudgetViewModel['savings']['currentPeriodStatus'];
    currentPeriodPlannedAmount: number;
    currentPeriodShortfallAmount: number;
    currentTotal: number;
    targetAmount: number;
    activeGoalDeadline: Date | string | null;
    userCreatedAt: Date | string | null;
  }): BudgetViewModel['savings']['alerts'] {
    const alerts: BudgetViewModel['savings']['alerts'] = [];

    if (params.currentPeriodStatus === 'PENDING') {
      alerts.push({
        id: 'pending-month-confirmation',
        tone: 'INFO',
        message: 'Aun no confirmaste el ahorro del mes actual.'
      });
    } else if (params.currentPeriodStatus === 'SKIPPED') {
      alerts.push({
        id: 'month-skipped',
        tone: 'WARNING',
        message: 'Marcaste el mes actual como omitido. Esto afecta tu consistencia de ahorro.'
      });
    } else if (params.currentPeriodShortfallAmount > 0) {
      alerts.push({
        id: 'month-shortfall',
        tone: 'WARNING',
        message:
          `Este mes faltaron ${this.formatCurrency(params.currentPeriodShortfallAmount)} ` +
          `vs lo planificado (${this.formatCurrency(params.currentPeriodPlannedAmount)}).`
      });
    }

    const periodMap = this.buildSavingsLogMap(params.savingsLogs);
    const recentClosedPeriods = this.buildClosedPeriodsSinceDate(
      params.currentPeriod,
      params.userCreatedAt
    ).slice(0, 3);
    const recentOutcomes = recentClosedPeriods.map((period) =>
      this.evaluateSavingsPeriodOutcome(periodMap.get(period), params.currentPeriodPlannedAmount)
    );

    let consecutiveMisses = 0;
    for (const outcome of recentOutcomes) {
      if (outcome.kind === 'MET') {
        break;
      }
      consecutiveMisses += 1;
    }

    if (consecutiveMisses >= 2) {
      alerts.push({
        id: 'consecutive-misses',
        tone: 'WARNING',
        message: 'Llevas al menos 2 meses sin cumplir el objetivo mensual. Ajusta el plan para recuperar ritmo.'
      });
    }

    let consecutiveSkips = 0;
    for (const outcome of recentOutcomes) {
      if (outcome.kind !== 'SKIPPED') {
        break;
      }
      consecutiveSkips += 1;
    }

    if (consecutiveSkips >= 2) {
      alerts.push({
        id: 'consecutive-skips',
        tone: 'CRITICAL',
        message: 'Llevas meses consecutivos sin ahorro confirmado. Prioriza un monto minimo para retomar disciplina.'
      });
    }

    if (params.targetAmount > 0 && params.currentTotal < params.targetAmount && params.activeGoalDeadline) {
      const deadline = new Date(params.activeGoalDeadline);
      if (Number.isFinite(deadline.getTime())) {
        const monthsAvailable = this.calculateMonthsUntil(deadline);
        const remaining = Math.max(params.targetAmount - params.currentTotal, 0);

        if (monthsAvailable <= 0 && remaining > 0) {
          alerts.push({
            id: 'goal-overdue',
            tone: 'CRITICAL',
            message: 'La meta ya vencio y aun tiene saldo pendiente.'
          });
        } else if (monthsAvailable > 0) {
          const runRate = this.calculateRollingRunRate(
            params.savingsLogs,
            params.currentPeriod,
            params.userCreatedAt,
            3
          );
          if (runRate <= 0) {
            alerts.push({
              id: 'no-recent-run-rate',
              tone: 'CRITICAL',
              message: 'Sin ahorro confirmado reciente no llegas a la fecha objetivo.'
            });
          } else {
            const monthsNeeded = remaining / runRate;
            if (monthsNeeded > monthsAvailable) {
              alerts.push({
                id: 'deadline-risk',
                tone: 'WARNING',
                message:
                  `Al ritmo reciente (${this.formatCurrency(runRate)}/mes), ` +
                  'la meta no llegaria a tiempo.'
              });
            }
          }
        }
      }
    }

    return alerts.slice(0, 3);
  }

  private buildSavingsLogMap(savingsLogs: SavingsLog[]): Map<string, SavingsLog> {
    const map = new Map<string, SavingsLog>();
    for (const log of savingsLogs) {
      map.set(log.period, log);
    }
    return map;
  }

  private buildClosedPeriodsSinceDate(
    currentPeriod: string,
    startDate: Date | string | null
  ): string[] {
    const parsedCurrentPeriod = this.parsePeriod(currentPeriod);
    const createdAt = startDate ? new Date(startDate) : null;

    if (!parsedCurrentPeriod || !createdAt || !Number.isFinite(createdAt.getTime())) {
      return [];
    }

    const startPeriod = this.toPeriod(createdAt);
    const parsedStartPeriod = this.parsePeriod(startPeriod);
    if (!parsedStartPeriod) {
      return [];
    }

    const startIndex = this.toMonthIndex(parsedStartPeriod.year, parsedStartPeriod.month);
    const endIndex = this.toMonthIndex(parsedCurrentPeriod.year, parsedCurrentPeriod.month) - 1;

    if (endIndex < startIndex) {
      return [];
    }

    const periods: string[] = [];
    for (let currentIndex = endIndex; currentIndex >= startIndex; currentIndex -= 1) {
      const { year, month } = this.fromMonthIndex(currentIndex);
      periods.push(`${year}-${String(month).padStart(2, '0')}`);
    }

    return periods;
  }

  private evaluateSavingsPeriodOutcome(
    log: SavingsLog | undefined,
    fallbackPlannedAmount: number
  ): { kind: 'MET' | 'PARTIAL' | 'SKIPPED'; ratio: number } {
    if (!log || log.status === 'SKIPPED') {
      return { kind: 'SKIPPED', ratio: 0 };
    }

    const confirmedAmount = this.normalizeAmount(log.confirmedAmount);
    if (confirmedAmount <= 0) {
      return { kind: 'SKIPPED', ratio: 0 };
    }

    const plannedAmount = this.normalizeAmount(
      log.monthlyGoalSnapshot ?? fallbackPlannedAmount
    );

    if (plannedAmount <= 0) {
      return { kind: 'MET', ratio: 1 };
    }

    const ratio = Math.max(0, Math.min(1, confirmedAmount / plannedAmount));
    if (ratio >= 1) {
      return { kind: 'MET', ratio: 1 };
    }

    return {
      kind: 'PARTIAL',
      ratio: this.normalizeAmount(ratio)
    };
  }

  private calculateRollingRunRate(
    savingsLogs: SavingsLog[],
    currentPeriod: string,
    userCreatedAt: Date | string | null,
    windowMonths: number
  ): number {
    const periodMap = this.buildSavingsLogMap(savingsLogs);
    const closedPeriods = this.buildClosedPeriodsSinceDate(
      currentPeriod,
      userCreatedAt
    ).slice(0, windowMonths);
    if (!closedPeriods.length) {
      return 0;
    }

    const total = closedPeriods.reduce((sum, period) => {
      const log = periodMap.get(period);
      if (!log || log.status === 'SKIPPED') {
        return sum;
      }
      return sum + this.normalizeAmount(log.confirmedAmount);
    }, 0);

    return this.normalizeAmount(total / closedPeriods.length);
  }

  private toMonthIndex(year: number, month: number): number {
    return year * 12 + (month - 1);
  }

  private fromMonthIndex(index: number): { year: number; month: number } {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    return { year, month };
  }

  private calculateMonthsUntil(deadline: Date): number {
    const today = new Date();
    const yearDiff = deadline.getFullYear() - today.getFullYear();
    const monthDiff = deadline.getMonth() - today.getMonth();
    return Math.max(yearDiff * 12 + monthDiff + 1, 0);
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

