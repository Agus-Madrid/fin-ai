import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { ConfirmSavingsLogDto } from './dtos/confirm-savings-log.dto';
import { SavingsLog } from './savings-log.entity';
import { SavingsLogStatus } from './savings-log-status.enum';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

@Injectable()
export class SavingsLogsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SavingsLog)
    private readonly savingsLogRepository: Repository<SavingsLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllByUser(userId: string, period?: string): Promise<SavingsLog[]> {
    await this.findUserById(userId);

    if (period) {
      this.validatePeriod(period);
    }

    return this.savingsLogRepository.find({
      where: {
        user: { id: userId },
        ...(period ? { period } : {}),
      },
      order: { period: 'DESC' },
    });
  }

  async confirm(dto: ConfirmSavingsLogDto): Promise<SavingsLog> {
    this.validatePeriod(dto.period);
    const status = this.resolveStatus(dto.status);

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const savingsLogRepository = manager.getRepository(SavingsLog);

      const user = await userRepository.findOne({ where: { id: dto.userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${dto.userId} not found`);
      }

      const monthlyGoalSnapshot = this.normalizeAmount(
        user.goalMonthlySavings ?? 0,
        'goalMonthlySavings',
      );

      const existing = await savingsLogRepository.findOne({
        where: { user: { id: user.id }, period: dto.period },
        relations: ['user'],
      });

      const previousAmount = Number(existing?.confirmedAmount ?? 0);
      const confirmedAmount = this.resolveConfirmedAmount(
        dto.confirmedAmount,
        status,
        monthlyGoalSnapshot,
      );

      const currentTotalSavings = this.normalizeAmount(
        user.currentTotalSavings ?? 0,
        'currentTotalSavings',
      );
      const nextTotalSavings = this.normalizeAmount(
        currentTotalSavings + (confirmedAmount - previousAmount),
        'currentTotalSavings',
      );

      if (nextTotalSavings < 0) {
        throw new BadRequestException(
          'currentTotalSavings cannot be negative after updating the monthly log',
        );
      }

      user.currentTotalSavings = nextTotalSavings;
      await userRepository.save(user);

      const confirmedAt = status === SavingsLogStatus.SKIPPED ? null : new Date();

      if (existing) {
        existing.monthlyGoalSnapshot = monthlyGoalSnapshot;
        existing.confirmedAmount = confirmedAmount;
        existing.status = status;
        existing.confirmedAt = confirmedAt;
        return savingsLogRepository.save(existing);
      }

      const savingsLog = savingsLogRepository.create({
        user,
        period: dto.period,
        monthlyGoalSnapshot,
        confirmedAmount,
        status,
        confirmedAt,
      });

      return savingsLogRepository.save(savingsLog);
    });
  }

  private resolveStatus(status?: SavingsLogStatus): SavingsLogStatus {
    if (!status) {
      return SavingsLogStatus.CONFIRMED;
    }

    if (!Object.values(SavingsLogStatus).includes(status)) {
      throw new BadRequestException(`Invalid savings log status: ${status}`);
    }

    return status;
  }

  private resolveConfirmedAmount(
    confirmedAmount: number | undefined,
    status: SavingsLogStatus,
    fallbackAmount: number,
  ) {
    if (status === SavingsLogStatus.SKIPPED) {
      return 0;
    }

    if (confirmedAmount === undefined || confirmedAmount === null) {
      return fallbackAmount;
    }

    return this.normalizeAmount(confirmedAmount, 'confirmedAmount');
  }

  private normalizeAmount(value: number, fieldName: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    if (parsed < 0) {
      throw new BadRequestException(`${fieldName} cannot be negative`);
    }
    return Math.round(parsed * 100) / 100;
  }

  private validatePeriod(period: string): void {
    if (!PERIOD_REGEX.test(period)) {
      throw new BadRequestException(
        'period must use format YYYY-MM (example: 2026-02)',
      );
    }
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }
}
