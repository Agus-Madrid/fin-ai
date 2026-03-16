import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { Income } from '../incomes/incomes.entity';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';

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

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(FixedCommitment)
    private readonly fixedCommitmentRepository: Repository<FixedCommitment>,
    @InjectRepository(SavingsLog)
    private readonly savingsLogRepository: Repository<SavingsLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getOverview(userId: string): Promise<BudgetOverview> {
    await this.ensureUserExists(userId);

    const currentPeriod = this.toPeriod(new Date());
    const [totalIncome, totalFixedExpenses, savingsConfirmedAmount] =
      await Promise.all([
        this.getTotalIncome(userId),
        this.getTotalFixedExpenses(userId),
        this.getConfirmedSavingsForPeriod(userId, currentPeriod),
      ]);

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

  private async getTotalIncome(userId: string): Promise<number> {
    const result = await this.incomeRepository
      .createQueryBuilder('income')
      .innerJoin('income.user', 'user')
      .select('COALESCE(SUM(income.amount), 0)', 'total')
      .where('user.id = :userId', { userId })
      .getRawOne<{ total: string | number | null }>();

    return this.normalizeAmount(result?.total ?? 0);
  }

  private async getTotalFixedExpenses(userId: string): Promise<number> {
    const result = await this.fixedCommitmentRepository
      .createQueryBuilder('fixedCommitment')
      .innerJoin('fixedCommitment.user', 'user')
      .select('COALESCE(SUM(fixedCommitment.amount), 0)', 'total')
      .where('user.id = :userId', { userId })
      .getRawOne<{ total: string | number | null }>();

    return this.normalizeAmount(result?.total ?? 0);
  }

  private async getConfirmedSavingsForPeriod(
    userId: string,
    period: string,
  ): Promise<number> {
    const currentPeriodLog = await this.savingsLogRepository.findOne({
      where: {
        user: { id: userId },
        period,
      },
    });

    return this.normalizeAmount(currentPeriodLog?.confirmedAmount ?? 0);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
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
}
