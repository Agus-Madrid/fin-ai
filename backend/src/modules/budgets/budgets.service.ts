import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { IncomeRuleType } from '../incomes/income-rule-type.enum';
import { Income } from '../incomes/incomes.entity';
import { IncomeMonthEntry } from '../monthly-financials/income-month-entry.entity';
import { MonthlyFinancialsService } from '../monthly-financials/monthly-financials.service';
import { MonthlySummary } from '../monthly-financials/monthly-summary.entity';
import { MonthlySummaryStatus } from '../monthly-financials/monthly-summary-status.enum';
import { SavingGoal } from '../savings-goals/saving-goal.entity';
import { SavingsLogStatus } from '../savings-logs/savings-log-status.enum';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';

const DEFAULT_INCOME_SOURCE = 'Ingreso manual';
const DEFAULT_FIXED_CATEGORY = 'Compromiso fijo';
const YEAR_MONTH_PERIOD_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

type PlannerSavingsStatus = 'PENDING' | 'CONFIRMED' | 'SKIPPED';
type PlannerSavingsCommittedType = 'PENDING' | 'CONFIRMED' | 'SKIPPED';

interface PlannerIncomeSource {
  id: string;
  label: string;
  source: string;
  amount: number;
  status: string;
  timing: string;
  progress: number;
}

interface PlannerFixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  progress: number;
  icon: string;
}

interface PlannerSavingGoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  deadline: Date;
  priority: number;
  allocatedAmount: number;
  progressPercent: number;
}

interface PlannerSavingsLogPoint {
  monthIndex: number;
  monthLabel: string;
  confirmedAmount: number;
}

interface PlannerSavingsDiscipline {
  score: number;
  evaluatedMonths: number;
  metMonths: number;
  partialMonths: number;
  skippedMonths: number;
  targetHitStreak: number;
}

type PlannerSavingsAlertTone = 'INFO' | 'WARNING' | 'CRITICAL';

interface PlannerSavingsAlert {
  id: string;
  tone: PlannerSavingsAlertTone;
  message: string;
}

interface PlannerSavingsTarget {
  goalName: string;
  goalId: string | null;
  monthlyGoal: number;
  monthlyGoalPercent: number;
  progress: number;
  projectedMessage: string;
  currentTotal: number;
  targetAmount: number;
  currentYear: number;
  currentPeriodLabel: string;
  currentPeriodStatus: PlannerSavingsStatus;
  currentPeriodPlannedAmount: number;
  currentPeriodConfirmedAmount: number;
  currentPeriodShortfallAmount: number;
  currentPeriodSuggestedAmount: number;
  discipline: PlannerSavingsDiscipline;
  alerts: PlannerSavingsAlert[];
  annualConfirmedTotal: number;
  annualLogs: PlannerSavingsLogPoint[];
}

interface PlannerCommitmentSummary {
  preCommitted: number;
  discretionary: number;
  preCommittedPercent: number;
  remainderPercent: number;
  savingsCommittedAmount: number;
  savingsCommittedType: PlannerSavingsCommittedType;
}

interface PlannerMonthlySummary {
  period: string;
  status: MonthlySummaryStatus;
  closedAt: Date | null;
  totalIncome: number;
  totalFixedExpenses: number;
  totalSavingsConfirmed: number;
  netBalance: number;
}

export interface BudgetOverview {
  currency: 'UYU';
  currentPeriod: string;
  totalIncome: number;
  totalFixedExpenses: number;
  savingsConfirmedAmount: number;
  fixedExpensePercent: number;
  spendableBalance: number;
  spendablePercent: number;
}

export interface BudgetPlannerViewModel {
  currency: 'UYU';
  incomeSources: PlannerIncomeSource[];
  fixedExpenses: PlannerFixedExpense[];
  savingGoals: PlannerSavingGoalProgress[];
  currentPeriodSavingGoals: PlannerSavingGoalProgress[];
  savings: PlannerSavingsTarget;
  commitments: PlannerCommitmentSummary;
  monthlySummary: PlannerMonthlySummary;
  totalIncome: number;
  totalFixed: number;
}

@Injectable()
export class BudgetsService {
  private readonly shortMonthFormatter = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
  });
  private readonly periodLabelFormatter = new Intl.DateTimeFormat('es-UY', {
    month: 'short',
    year: 'numeric',
  });

  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(FixedCommitment)
    private readonly fixedCommitmentRepository: Repository<FixedCommitment>,
    @InjectRepository(SavingsLog)
    private readonly savingsLogRepository: Repository<SavingsLog>,
    @InjectRepository(SavingGoal)
    private readonly savingGoalRepository: Repository<SavingGoal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly monthlyFinancialsService: MonthlyFinancialsService,
  ) {}

  async getOverview(userId: string): Promise<BudgetOverview> {
    const currentPeriod = this.toPeriod(new Date());
    const currentPeriodSummary =
      await this.monthlyFinancialsService.calculateAndPersistMonthlySummary(
        userId,
        currentPeriod,
      );

    const totalIncome = this.normalizeAmount(currentPeriodSummary.totalIncome);
    const totalFixedExpenses = this.normalizeAmount(
      currentPeriodSummary.totalFixedExpenses,
    );
    const savingsConfirmedAmount = this.normalizeAmount(
      currentPeriodSummary.totalSavingsConfirmed,
    );

    const spendableBalance = this.normalizeAmount(
      totalIncome - totalFixedExpenses - savingsConfirmedAmount,
    );
    const fixedExpensePercent =
      totalIncome <= 0
        ? 0
        : this.normalizeAmount((totalFixedExpenses / totalIncome) * 100);
    const spendablePercent =
      totalIncome <= 0
        ? 0
        : this.normalizeAmount((spendableBalance / totalIncome) * 100);

    return {
      currency: 'UYU',
      currentPeriod,
      totalIncome,
      totalFixedExpenses,
      savingsConfirmedAmount,
      fixedExpensePercent,
      spendableBalance,
      spendablePercent,
    };
  }

  async getPlannerViewModel(userId: string): Promise<BudgetPlannerViewModel> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const currentPeriod = this.toPeriod(new Date());
    const [
      incomes,
      fixedCommitments,
      savingsLogs,
      savingGoals,
      activeSavingGoals,
      currentPeriodSummary,
      currentPeriodIncomeEntries,
    ] = await Promise.all([
      this.incomeRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'ASC' },
      }),
      this.fixedCommitmentRepository.find({ where: { user: { id: userId } } }),
      this.savingsLogRepository.find({
        where: { user: { id: userId } },
        order: { period: 'DESC' },
      }),
      this.findSavingGoalsByUser(userId, false),
      this.findSavingGoalsByUser(userId, true),
      this.monthlyFinancialsService.calculateAndPersistMonthlySummary(
        userId,
        currentPeriod,
      ),
      this.monthlyFinancialsService.findIncomeEntriesForPeriod(
        userId,
        currentPeriod,
      ),
    ]);

    return this.buildPlannerViewModel(
      incomes,
      currentPeriodIncomeEntries,
      currentPeriodSummary,
      currentPeriod,
      fixedCommitments,
      user,
      savingsLogs,
      savingGoals,
      activeSavingGoals,
    );
  }

  async listMonthlySummaries(userId: string, limit?: number) {
    return this.monthlyFinancialsService.listMonthlySummaries(userId, limit);
  }

  async getMonthlySummaryForPeriod(userId: string, period: string) {
    return this.monthlyFinancialsService.getMonthlySummaryForPeriod(
      userId,
      period,
    );
  }

  async closeMonthlySummary(userId: string, period: string) {
    return this.monthlyFinancialsService.closeMonthlySummary(userId, period);
  }

  private buildPlannerViewModel(
    incomes: Income[],
    currentPeriodIncomeEntries: IncomeMonthEntry[],
    currentPeriodSummary: MonthlySummary,
    currentPeriod: string,
    fixedCommitments: FixedCommitment[],
    user: User,
    savingsLogs: SavingsLog[],
    savingGoals: SavingGoal[],
    currentPeriodSavingGoals: SavingGoal[],
  ): BudgetPlannerViewModel {
    const incomeSources = this.buildIncomeSourcesForPeriod(
      incomes,
      currentPeriodIncomeEntries,
      currentPeriod,
    );
    const fixedExpenses = fixedCommitments.map((commitment) =>
      this.toFixedExpense(commitment),
    );

    const totalIncome = this.normalizeAmount(currentPeriodSummary.totalIncome);
    const totalFixed = this.normalizeAmount(
      currentPeriodSummary.totalFixedExpenses,
    );

    const monthlyGoal = this.normalizeAmount(user.goalMonthlySavings ?? 0);
    const monthlyGoalPercent =
      totalIncome > 0
        ? Math.max(0, Math.min(100, (monthlyGoal / totalIncome) * 100))
        : 0;

    const currentTotal = this.normalizeAmount(user.currentTotalSavings ?? 0);
    const orderedGoals = this.buildSavingGoalsProgress(
      savingGoals,
      currentTotal,
    );
    const orderedCurrentPeriodGoals = this.buildSavingGoalsProgress(
      currentPeriodSavingGoals,
      currentTotal,
    );

    const activeGoal = orderedCurrentPeriodGoals[0] ?? null;
    const goalName = activeGoal?.name?.trim() || 'Meta de ahorro';
    const targetAmount = this.normalizeAmount(activeGoal?.targetAmount ?? 0);
    const progress =
      targetAmount > 0
        ? Math.max(0, Math.min(100, (currentTotal / targetAmount) * 100))
        : 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const annualLogs = this.buildAnnualLogs(savingsLogs, currentYear);
    const annualConfirmedTotal = annualLogs.reduce(
      (sum, item) => sum + item.confirmedAmount,
      0,
    );

    const currentPeriodLog = savingsLogs.find(
      (log) => log.period === currentPeriod,
    );
    const currentPeriodStatus: PlannerSavingsStatus =
      (currentPeriodLog?.status as PlannerSavingsStatus | undefined) ??
      'PENDING';
    const currentPeriodPlannedAmount = this.normalizeAmount(
      currentPeriodLog?.monthlyGoalSnapshot ?? monthlyGoal,
    );
    const currentPeriodConfirmedAmount = this.normalizeAmount(
      currentPeriodLog?.confirmedAmount ?? 0,
    );
    const currentPeriodShortfallAmount =
      currentPeriodStatus === 'CONFIRMED'
        ? Math.max(
            this.normalizeAmount(
              currentPeriodPlannedAmount - currentPeriodConfirmedAmount,
            ),
            0,
          )
        : 0;
    const currentPeriodSuggestedAmount =
      currentPeriodStatus === 'PENDING'
        ? monthlyGoal
        : currentPeriodConfirmedAmount;

    const savingsCommitted = this.resolveSavingsCommittedForPeriod(
      currentPeriodStatus,
      currentPeriodConfirmedAmount,
    );
    const preCommitted = this.normalizeAmount(
      totalFixed + savingsCommitted.amount,
    );
    const discretionary = Math.max(
      this.normalizeAmount(totalIncome - preCommitted),
      0,
    );
    const remainderPercent =
      totalIncome > 0 ? Math.round((discretionary / totalIncome) * 100) : 0;
    const preCommittedPercent =
      totalIncome > 0 ? Math.max(0, Math.min(100, 100 - remainderPercent)) : 0;

    const discipline = this.buildDisciplineMetrics(
      savingsLogs,
      currentPeriod,
      monthlyGoal,
      user.createdAt ?? null,
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
      userCreatedAt: user.createdAt ?? null,
    });
    const projectedMessage = this.buildProjectedMessage(
      currentTotal,
      targetAmount,
      monthlyGoal,
    );

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
        annualLogs,
      },
      commitments: {
        preCommitted,
        discretionary,
        preCommittedPercent,
        remainderPercent,
        savingsCommittedAmount: savingsCommitted.amount,
        savingsCommittedType: savingsCommitted.type,
      },
      monthlySummary: {
        period: currentPeriodSummary.period,
        status: currentPeriodSummary.status,
        closedAt: currentPeriodSummary.closedAt,
        totalIncome: this.normalizeAmount(currentPeriodSummary.totalIncome),
        totalFixedExpenses: this.normalizeAmount(
          currentPeriodSummary.totalFixedExpenses,
        ),
        totalSavingsConfirmed: this.normalizeAmount(
          currentPeriodSummary.totalSavingsConfirmed,
        ),
        netBalance: this.normalizeAmount(currentPeriodSummary.netBalance),
      },
      totalIncome,
      totalFixed,
    };
  }

  private buildIncomeSourcesForPeriod(
    incomes: Income[],
    incomeMonthEntries: IncomeMonthEntry[],
    period: string,
  ): PlannerIncomeSource[] {
    const entriesByIncomeRuleId = new Map<string, IncomeMonthEntry>();
    for (const incomeMonthEntry of incomeMonthEntries) {
      if (!incomeMonthEntry.incomeRule?.id) {
        continue;
      }
      entriesByIncomeRuleId.set(
        incomeMonthEntry.incomeRule.id,
        incomeMonthEntry,
      );
    }

    return incomes.map((income) =>
      this.toIncomeSourceForPeriod(
        income,
        entriesByIncomeRuleId.get(income.id),
        period,
      ),
    );
  }

  private toIncomeSourceForPeriod(
    income: Income,
    incomeMonthEntry: IncomeMonthEntry | undefined,
    currentPeriod: string,
  ): PlannerIncomeSource {
    const parsedAmount = Number(incomeMonthEntry?.amount ?? 0);
    const includedInCurrentPeriod = Boolean(incomeMonthEntry);

    return {
      id: income.id,
      label: income.name,
      source: income.description ?? DEFAULT_INCOME_SOURCE,
      amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
      status: includedInCurrentPeriod ? 'Incluido' : 'No aplica',
      timing: this.buildIncomeTimingLabel(income, currentPeriod),
      progress: includedInCurrentPeriod ? 100 : 0,
    };
  }

  private buildIncomeTimingLabel(
    income: Income,
    currentPeriod: string,
  ): string {
    if (income.ruleType === IncomeRuleType.ONE_TIME) {
      const targetPeriodLabel = income.targetPeriod ?? 'Sin mes';
      return targetPeriodLabel === currentPeriod
        ? `Puntual · ${targetPeriodLabel} (mes actual)`
        : `Puntual · ${targetPeriodLabel}`;
    }

    const startPeriodLabel = income.startPeriod ?? 'Sin inicio';
    return startPeriodLabel === currentPeriod
      ? `Mensual · desde ${startPeriodLabel} (inicio actual)`
      : `Mensual · desde ${startPeriodLabel}`;
  }

  private toFixedExpense(commitment: FixedCommitment): PlannerFixedExpense {
    const parsedAmount = Number(commitment.amount);
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    return {
      id: commitment.id,
      name: commitment.name,
      category: commitment.description ?? DEFAULT_FIXED_CATEGORY,
      amount,
      progress: 100,
      icon: 'bi-receipt',
    };
  }

  private resolveSavingsCommittedForPeriod(
    currentPeriodStatus: PlannerSavingsStatus,
    currentPeriodConfirmedAmount: number,
  ): { amount: number; type: PlannerSavingsCommittedType } {
    if (currentPeriodStatus === 'CONFIRMED') {
      return {
        amount: this.normalizeAmount(currentPeriodConfirmedAmount),
        type: 'CONFIRMED',
      };
    }

    if (currentPeriodStatus === 'SKIPPED') {
      return {
        amount: this.normalizeAmount(currentPeriodConfirmedAmount),
        type: 'SKIPPED',
      };
    }

    return {
      amount: this.normalizeAmount(currentPeriodConfirmedAmount),
      type: 'PENDING',
    };
  }

  private buildSavingGoalsProgress(
    goals: SavingGoal[],
    currentTotalSavings: number,
  ): PlannerSavingGoalProgress[] {
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
      remaining = Math.max(
        0,
        this.normalizeAmount(remaining - allocatedAmount),
      );

      const progressPercent =
        targetAmount > 0
          ? Math.max(0, Math.min(100, (allocatedAmount / targetAmount) * 100))
          : 0;

      return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        deadline: goal.deadline,
        priority: Number(goal.priority ?? 1),
        allocatedAmount: this.normalizeAmount(allocatedAmount),
        progressPercent: this.normalizeAmount(progressPercent),
      };
    });
  }

  private buildAnnualLogs(
    savingsLogs: SavingsLog[],
    year: number,
  ): PlannerSavingsLogPoint[] {
    const base = Array.from({ length: 12 }, (_, index) => ({
      monthIndex: index + 1,
      monthLabel: this.getMonthLabel(index),
      confirmedAmount: 0,
    }));

    for (const log of savingsLogs) {
      const parsed = this.parsePeriod(log.period);
      if (!parsed || parsed.year !== year) {
        continue;
      }

      const currentAmount = base[parsed.month - 1].confirmedAmount;
      base[parsed.month - 1].confirmedAmount = this.normalizeAmount(
        currentAmount + this.normalizeAmount(log.confirmedAmount),
      );
    }

    return base;
  }

  private buildProjectedMessage(
    currentTotal: number,
    targetAmount: number,
    monthlyGoal: number,
  ): string {
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
    userCreatedAt: Date | string | null,
  ): PlannerSavingsDiscipline {
    const periodMap = this.buildSavingsLogMap(savingsLogs);
    const closedPeriods = this.buildClosedPeriodsSinceDate(
      currentPeriod,
      userCreatedAt,
    );

    if (!closedPeriods.length) {
      return {
        score: 0,
        evaluatedMonths: 0,
        metMonths: 0,
        partialMonths: 0,
        skippedMonths: 0,
        targetHitStreak: 0,
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
        fallbackMonthlyGoal,
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
      targetHitStreak,
    };
  }

  private buildSavingsAlerts(params: {
    savingsLogs: SavingsLog[];
    currentPeriod: string;
    currentPeriodStatus: PlannerSavingsStatus;
    currentPeriodPlannedAmount: number;
    currentPeriodShortfallAmount: number;
    currentTotal: number;
    targetAmount: number;
    activeGoalDeadline: Date | string | null;
    userCreatedAt: Date | string | null;
  }): PlannerSavingsAlert[] {
    const alerts: PlannerSavingsAlert[] = [];

    if (params.currentPeriodStatus === 'PENDING') {
      alerts.push({
        id: 'pending-month-confirmation',
        tone: 'INFO',
        message: 'Aun no confirmaste el ahorro del mes actual.',
      });
    } else if (params.currentPeriodStatus === 'SKIPPED') {
      alerts.push({
        id: 'month-skipped',
        tone: 'WARNING',
        message:
          'Marcaste el mes actual como omitido. Esto afecta tu consistencia de ahorro.',
      });
    } else if (params.currentPeriodShortfallAmount > 0) {
      alerts.push({
        id: 'month-shortfall',
        tone: 'WARNING',
        message:
          `Este mes faltaron ${this.formatCurrency(params.currentPeriodShortfallAmount)} ` +
          `vs lo planificado (${this.formatCurrency(params.currentPeriodPlannedAmount)}).`,
      });
    }

    const periodMap = this.buildSavingsLogMap(params.savingsLogs);
    const recentClosedPeriods = this.buildClosedPeriodsSinceDate(
      params.currentPeriod,
      params.userCreatedAt,
    ).slice(0, 3);
    const recentOutcomes = recentClosedPeriods.map((period) =>
      this.evaluateSavingsPeriodOutcome(
        periodMap.get(period),
        params.currentPeriodPlannedAmount,
      ),
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
        message:
          'Llevas al menos 2 meses sin cumplir el objetivo mensual. Ajusta el plan para recuperar ritmo.',
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
        message:
          'Llevas meses consecutivos sin ahorro confirmado. Prioriza un monto minimo para retomar disciplina.',
      });
    }

    if (
      params.targetAmount > 0 &&
      params.currentTotal < params.targetAmount &&
      params.activeGoalDeadline
    ) {
      const deadline = new Date(params.activeGoalDeadline);
      if (Number.isFinite(deadline.getTime())) {
        const monthsAvailable = this.calculateMonthsUntil(deadline);
        const remaining = Math.max(
          params.targetAmount - params.currentTotal,
          0,
        );

        if (monthsAvailable <= 0 && remaining > 0) {
          alerts.push({
            id: 'goal-overdue',
            tone: 'CRITICAL',
            message: 'La meta ya vencio y aun tiene saldo pendiente.',
          });
        } else if (monthsAvailable > 0) {
          const runRate = this.calculateRollingRunRate(
            params.savingsLogs,
            params.currentPeriod,
            params.userCreatedAt,
            3,
          );
          if (runRate <= 0) {
            alerts.push({
              id: 'no-recent-run-rate',
              tone: 'CRITICAL',
              message:
                'Sin ahorro confirmado reciente no llegas a la fecha objetivo.',
            });
          } else {
            const monthsNeeded = remaining / runRate;
            if (monthsNeeded > monthsAvailable) {
              alerts.push({
                id: 'deadline-risk',
                tone: 'WARNING',
                message:
                  `Al ritmo reciente (${this.formatCurrency(runRate)}/mes), ` +
                  'la meta no llegaria a tiempo.',
              });
            }
          }
        }
      }
    }

    return alerts.slice(0, 3);
  }

  private buildSavingsLogMap(
    savingsLogs: SavingsLog[],
  ): Map<string, SavingsLog> {
    const map = new Map<string, SavingsLog>();
    for (const log of savingsLogs) {
      map.set(log.period, log);
    }
    return map;
  }

  private buildClosedPeriodsSinceDate(
    currentPeriod: string,
    startDate: Date | string | null,
  ): string[] {
    const parsedCurrentPeriod = this.parsePeriod(currentPeriod);
    const createdAt = startDate ? new Date(startDate) : null;

    if (
      !parsedCurrentPeriod ||
      !createdAt ||
      !Number.isFinite(createdAt.getTime())
    ) {
      return [];
    }

    const startPeriod = this.toPeriod(createdAt);
    const parsedStartPeriod = this.parsePeriod(startPeriod);
    if (!parsedStartPeriod) {
      return [];
    }

    const startIndex = this.toMonthIndex(
      parsedStartPeriod.year,
      parsedStartPeriod.month,
    );
    const endIndex =
      this.toMonthIndex(parsedCurrentPeriod.year, parsedCurrentPeriod.month) -
      1;

    if (endIndex < startIndex) {
      return [];
    }

    const periods: string[] = [];
    for (
      let currentIndex = endIndex;
      currentIndex >= startIndex;
      currentIndex -= 1
    ) {
      const { year, month } = this.fromMonthIndex(currentIndex);
      periods.push(`${year}-${String(month).padStart(2, '0')}`);
    }

    return periods;
  }

  private evaluateSavingsPeriodOutcome(
    log: SavingsLog | undefined,
    fallbackPlannedAmount: number,
  ): { kind: 'MET' | 'PARTIAL' | 'SKIPPED'; ratio: number } {
    if (!log || log.status === SavingsLogStatus.SKIPPED) {
      return { kind: 'SKIPPED', ratio: 0 };
    }

    const confirmedAmount = this.normalizeAmount(log.confirmedAmount);
    if (confirmedAmount <= 0) {
      return { kind: 'SKIPPED', ratio: 0 };
    }

    const plannedAmount = this.normalizeAmount(
      log.monthlyGoalSnapshot ?? fallbackPlannedAmount,
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
      ratio: this.normalizeAmount(ratio),
    };
  }

  private calculateRollingRunRate(
    savingsLogs: SavingsLog[],
    currentPeriod: string,
    userCreatedAt: Date | string | null,
    windowMonths: number,
  ): number {
    const periodMap = this.buildSavingsLogMap(savingsLogs);
    const closedPeriods = this.buildClosedPeriodsSinceDate(
      currentPeriod,
      userCreatedAt,
    ).slice(0, windowMonths);

    if (!closedPeriods.length) {
      return 0;
    }

    const total = closedPeriods.reduce((sum, period) => {
      const log = periodMap.get(period);
      if (!log || log.status === SavingsLogStatus.SKIPPED) {
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
    const label = this.shortMonthFormatter
      .format(new Date(2026, zeroBasedMonth, 1))
      .replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private parsePeriod(period: string): { year: number; month: number } | null {
    const match = YEAR_MONTH_PERIOD_REGEX.exec(period);
    if (!match) {
      return null;
    }

    return {
      year: Number(match[1]),
      month: Number(match[2]),
    };
  }

  private toPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private async findSavingGoalsByUser(
    userId: string,
    activeOnly: boolean,
  ): Promise<SavingGoal[]> {
    const query = this.savingGoalRepository
      .createQueryBuilder('goal')
      .innerJoin('goal.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('goal.priority', 'ASC')
      .addOrderBy('goal.deadline', 'ASC');

    if (activeOnly) {
      query.andWhere('goal.deadline >= :today', {
        today: this.getTodayDateOnly(),
      });
    }

    return query.getMany();
  }

  private getTodayDateOnly(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeAmount(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.round(parsed * 100) / 100;
  }
}
