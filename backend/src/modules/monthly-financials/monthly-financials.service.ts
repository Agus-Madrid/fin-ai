import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { IncomeRuleType } from '../incomes/income-rule-type.enum';
import { Income } from '../incomes/incomes.entity';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';
import { IncomeMonthEntry } from './income-month-entry.entity';
import { MonthlySummary } from './monthly-summary.entity';
import { MonthlySummaryStatus } from './monthly-summary-status.enum';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_SUMMARY_LIST_LIMIT = 60;
const DEFAULT_SUMMARY_LIST_LIMIT = 24;

@Injectable()
export class MonthlyFinancialsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(IncomeMonthEntry)
    private readonly incomeMonthEntryRepository: Repository<IncomeMonthEntry>,
    @InjectRepository(MonthlySummary)
    private readonly monthlySummaryRepository: Repository<MonthlySummary>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async calculateAndPersistMonthlySummary(
    userId: string,
    period: string,
  ): Promise<MonthlySummary> {
    this.validatePeriodOrThrow(period);

    return this.dataSource.transaction((manager) =>
      this.calculateAndPersistMonthlySummaryWithManager(
        manager,
        userId,
        period,
      ),
    );
  }

  async closeMonthlySummary(
    userId: string,
    period: string,
  ): Promise<MonthlySummary> {
    this.validatePeriodOrThrow(period);

    return this.dataSource.transaction(async (manager) => {
      const monthlySummary =
        await this.calculateAndPersistMonthlySummaryWithManager(
          manager,
          userId,
          period,
        );

      if (monthlySummary.status === MonthlySummaryStatus.CLOSED) {
        return monthlySummary;
      }

      monthlySummary.status = MonthlySummaryStatus.CLOSED;
      monthlySummary.closedAt = new Date();
      monthlySummary.calculatedAt = new Date();
      return manager.getRepository(MonthlySummary).save(monthlySummary);
    });
  }

  async listMonthlySummaries(
    userId: string,
    limit = DEFAULT_SUMMARY_LIST_LIMIT,
  ): Promise<MonthlySummary[]> {
    await this.ensureUserExistsOrThrow(userId);

    const normalizedLimit = this.normalizeListLimit(limit);
    await this.recalculateCurrentPeriodForUser(userId);

    return this.monthlySummaryRepository.find({
      where: { user: { id: userId } },
      order: { period: 'DESC' },
      take: normalizedLimit,
    });
  }

  async getMonthlySummaryForPeriod(
    userId: string,
    period: string,
  ): Promise<MonthlySummary> {
    this.validatePeriodOrThrow(period);

    const summary = await this.monthlySummaryRepository.findOne({
      where: { user: { id: userId }, period },
    });
    if (summary) {
      return summary;
    }

    return this.calculateAndPersistMonthlySummary(userId, period);
  }

  async findIncomeEntriesForPeriod(
    userId: string,
    period: string,
  ): Promise<IncomeMonthEntry[]> {
    this.validatePeriodOrThrow(period);
    await this.ensureUserExistsOrThrow(userId);

    return this.incomeMonthEntryRepository.find({
      where: { user: { id: userId }, period },
      relations: ['incomeRule'],
      order: {
        sourceLabel: 'ASC',
      },
    });
  }

  async recalculateCurrentPeriodForUser(userId: string): Promise<void> {
    const currentPeriod = this.buildCurrentPeriod();
    await this.calculateAndPersistMonthlySummary(userId, currentPeriod);
  }

  async recalculateOpenPeriodsForUser(userId: string): Promise<void> {
    await this.ensureUserExistsOrThrow(userId);

    const currentPeriod = this.buildCurrentPeriod();
    const openSummaries = await this.monthlySummaryRepository.find({
      where: {
        user: { id: userId },
        status: MonthlySummaryStatus.OPEN,
      },
      select: ['period'],
    });

    const openPeriods = new Set<string>([currentPeriod]);
    for (const openSummary of openSummaries) {
      openPeriods.add(openSummary.period);
    }

    const sortedOpenPeriods = [...openPeriods].sort();
    for (const period of sortedOpenPeriods) {
      await this.calculateAndPersistMonthlySummary(userId, period);
    }
  }

  async assertMonthIsOpenForMutation(
    userId: string,
    period: string,
  ): Promise<void> {
    this.validatePeriodOrThrow(period);

    const summary = await this.monthlySummaryRepository.findOne({
      where: { user: { id: userId }, period },
    });

    if (summary?.status === MonthlySummaryStatus.CLOSED) {
      throw new BadRequestException(
        `period ${period} is already closed and cannot be modified`,
      );
    }
  }

  private async calculateAndPersistMonthlySummaryWithManager(
    manager: EntityManager,
    userId: string,
    period: string,
  ): Promise<MonthlySummary> {
    const user = await manager
      .getRepository(User)
      .findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const summaryRepository = manager.getRepository(MonthlySummary);
    const existingSummary = await summaryRepository.findOne({
      where: { user: { id: userId }, period },
      relations: ['user'],
    });

    if (existingSummary?.status === MonthlySummaryStatus.CLOSED) {
      return existingSummary;
    }

    const applicableIncomeRules = await this.findApplicableIncomeRulesForPeriod(
      manager,
      userId,
      period,
    );
    const incomeEntries = await this.synchronizeIncomeEntriesForPeriod(
      manager,
      user,
      period,
      applicableIncomeRules,
    );

    const totalIncome = this.normalizeAmount(
      incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0),
    );
    const totalFixedExpenses = await this.calculateTotalFixedExpensesForPeriod(
      manager,
      userId,
    );
    const totalSavingsConfirmed =
      await this.calculateTotalSavingsConfirmedForPeriod(
        manager,
        userId,
        period,
      );
    const netBalance = this.normalizeAmount(
      totalIncome - totalFixedExpenses - totalSavingsConfirmed,
    );

    const summary = existingSummary
      ? existingSummary
      : summaryRepository.create({
          user,
          period,
          status: MonthlySummaryStatus.OPEN,
          closedAt: null,
        });

    summary.totalIncome = totalIncome;
    summary.totalFixedExpenses = totalFixedExpenses;
    summary.totalSavingsConfirmed = totalSavingsConfirmed;
    summary.netBalance = netBalance;
    summary.calculatedAt = new Date();

    return summaryRepository.save(summary);
  }

  private async findApplicableIncomeRulesForPeriod(
    manager: EntityManager,
    userId: string,
    period: string,
  ): Promise<Income[]> {
    const incomeRules = await manager.getRepository(Income).find({
      where: {
        user: { id: userId },
        isActive: true,
      },
      relations: ['user'],
      order: {
        createdAt: 'ASC',
      },
    });

    return incomeRules.filter((incomeRule) =>
      this.isIncomeRuleApplicableToPeriod(incomeRule, period),
    );
  }

  private isIncomeRuleApplicableToPeriod(
    incomeRule: Income,
    period: string,
  ): boolean {
    if (!incomeRule.isActive) {
      return false;
    }

    if (incomeRule.ruleType === IncomeRuleType.ONE_TIME) {
      return incomeRule.targetPeriod === period;
    }

    if (!incomeRule.startPeriod) {
      return true;
    }

    return incomeRule.startPeriod <= period;
  }

  private async synchronizeIncomeEntriesForPeriod(
    manager: EntityManager,
    user: User,
    period: string,
    applicableIncomeRules: Income[],
  ): Promise<IncomeMonthEntry[]> {
    const incomeMonthEntryRepository = manager.getRepository(IncomeMonthEntry);
    const currentEntries = await incomeMonthEntryRepository.find({
      where: { user: { id: user.id }, period },
      relations: ['incomeRule'],
    });

    const currentEntriesByRuleId = new Map<string, IncomeMonthEntry>();
    for (const entry of currentEntries) {
      if (!entry.incomeRule?.id) {
        continue;
      }
      currentEntriesByRuleId.set(entry.incomeRule.id, entry);
    }

    const nextEntries: IncomeMonthEntry[] = [];
    for (const incomeRule of applicableIncomeRules) {
      const existingEntry = currentEntriesByRuleId.get(incomeRule.id);
      const normalizedAmount = this.normalizeAmount(incomeRule.amount);

      const incomeMonthEntry = existingEntry
        ? existingEntry
        : incomeMonthEntryRepository.create({
            period,
            user,
            incomeRule,
          });

      incomeMonthEntry.amount = normalizedAmount;
      incomeMonthEntry.sourceLabel = incomeRule.name;
      incomeMonthEntry.sourceDescription = incomeRule.description ?? null;
      incomeMonthEntry.sourceRuleType = incomeRule.ruleType;

      nextEntries.push(incomeMonthEntry);
    }

    const persistedEntries = nextEntries.length
      ? await incomeMonthEntryRepository.save(nextEntries)
      : [];

    const applicableRuleIds = new Set(
      applicableIncomeRules.map((rule) => rule.id),
    );
    const staleEntries = currentEntries.filter(
      (entry) =>
        !entry.incomeRule?.id || !applicableRuleIds.has(entry.incomeRule.id),
    );
    if (staleEntries.length) {
      await incomeMonthEntryRepository.remove(staleEntries);
    }

    return persistedEntries;
  }

  private async calculateTotalFixedExpensesForPeriod(
    manager: EntityManager,
    userId: string,
  ): Promise<number> {
    const result = await manager
      .getRepository(FixedCommitment)
      .createQueryBuilder('fixedCommitment')
      .innerJoin('fixedCommitment.user', 'user')
      .select('COALESCE(SUM(fixedCommitment.amount), 0)', 'total')
      .where('user.id = :userId', { userId })
      .getRawOne<{ total: string | number | null }>();

    return this.normalizeAmount(result?.total ?? 0);
  }

  private async calculateTotalSavingsConfirmedForPeriod(
    manager: EntityManager,
    userId: string,
    period: string,
  ): Promise<number> {
    const savingsLog = await manager.getRepository(SavingsLog).findOne({
      where: {
        user: { id: userId },
        period,
      },
    });

    return this.normalizeAmount(savingsLog?.confirmedAmount ?? 0);
  }

  private normalizeListLimit(limit: number): number {
    const parsedLimit = Number(limit);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return DEFAULT_SUMMARY_LIST_LIMIT;
    }

    return Math.min(Math.floor(parsedLimit), MAX_SUMMARY_LIST_LIMIT);
  }

  private validatePeriodOrThrow(period: string): void {
    if (!PERIOD_REGEX.test(period)) {
      throw new BadRequestException(
        'period must use format YYYY-MM (example: 2026-03)',
      );
    }
  }

  private async ensureUserExistsOrThrow(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }

  private buildCurrentPeriod(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private normalizeAmount(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.round(parsed * 100) / 100;
  }
}
