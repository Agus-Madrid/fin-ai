import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Income } from './incomes.entity';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dtos/create-income.dto';
import { User } from '../user/user.entity';
import { UpdateIncomeDto } from './dtos/update-income.dto';
import { IncomeRuleType } from './income-rule-type.enum';
import { MonthlyFinancialsService } from '../monthly-financials/monthly-financials.service';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

interface NormalizedIncomeRuleMutationInput {
  name: string;
  description: string | null;
  amount: number;
  ruleType: IncomeRuleType;
  startPeriod: string | null;
  targetPeriod: string | null;
  isActive: boolean;
}

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly monthlyFinancialsService: MonthlyFinancialsService,
  ) {}

  async findAllByUser(userId: string): Promise<Income[]> {
    return await this.incomeRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    userId: string,
    createIncomeDto: CreateIncomeDto,
  ): Promise<Income> {
    const normalizedInput = this.normalizeCreateIncomeInput(createIncomeDto);
    const user = await this.findUserById(userId);

    const income = this.incomeRepository.create({
      ...normalizedInput,
      user,
    });
    const savedIncome = await this.incomeRepository.save(income);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
    return savedIncome;
  }

  async update(
    userId: string,
    id: string,
    updateData: UpdateIncomeDto,
  ): Promise<Income> {
    const income = await this.findByIdForUser(id, userId);
    const normalizedInput = this.normalizeUpdateIncomeInput(income, updateData);

    income.name = normalizedInput.name;
    income.description = normalizedInput.description;
    income.amount = normalizedInput.amount;
    income.ruleType = normalizedInput.ruleType;
    income.startPeriod = normalizedInput.startPeriod;
    income.targetPeriod = normalizedInput.targetPeriod;
    income.isActive = normalizedInput.isActive;

    const savedIncome = await this.incomeRepository.save(income);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
    return savedIncome;
  }

  async delete(userId: string, id: string): Promise<void> {
    const income = await this.findByIdForUser(id, userId);
    await this.incomeRepository.remove(income);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  private async findByIdForUser(id: string, userId: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!income) {
      throw new NotFoundException(
        `Income with id ${id} not found for current user`,
      );
    }

    return income;
  }

  private normalizeCreateIncomeInput(
    createIncomeDto: CreateIncomeDto,
  ): NormalizedIncomeRuleMutationInput {
    const name = this.normalizeRequiredString(createIncomeDto.name, 'name');
    const description = this.normalizeOptionalString(
      createIncomeDto.description,
    );
    const amount = this.normalizeAmount(createIncomeDto.amount, 'amount');
    const ruleType = this.resolveRuleType(createIncomeDto.ruleType);
    const periodFields = this.resolvePeriodsByRuleType(
      ruleType,
      this.normalizeOptionalPeriodValue(
        createIncomeDto.startPeriod,
        'startPeriod',
      ),
      this.normalizeOptionalPeriodValue(
        createIncomeDto.targetPeriod,
        'targetPeriod',
      ),
    );
    const isActive = this.normalizeIsActive(createIncomeDto.isActive);

    return {
      name,
      description,
      amount,
      ruleType,
      startPeriod: periodFields.startPeriod,
      targetPeriod: periodFields.targetPeriod,
      isActive,
    };
  }

  private normalizeUpdateIncomeInput(
    income: Income,
    updateIncomeDto: UpdateIncomeDto,
  ): NormalizedIncomeRuleMutationInput {
    const name = this.hasOwnField(updateIncomeDto, 'name')
      ? this.normalizeRequiredString(updateIncomeDto.name, 'name')
      : income.name;

    const description = this.hasOwnField(updateIncomeDto, 'description')
      ? this.normalizeOptionalString(updateIncomeDto.description)
      : (income.description ?? null);

    const amount = this.hasOwnField(updateIncomeDto, 'amount')
      ? this.normalizeAmount(updateIncomeDto.amount, 'amount')
      : this.normalizeAmount(income.amount, 'amount');

    const ruleType = this.hasOwnField(updateIncomeDto, 'ruleType')
      ? this.resolveRuleType(updateIncomeDto.ruleType)
      : income.ruleType;

    const startPeriodInput = this.hasOwnField(updateIncomeDto, 'startPeriod')
      ? this.normalizeOptionalPeriodValue(
          updateIncomeDto.startPeriod,
          'startPeriod',
        )
      : income.startPeriod;

    const targetPeriodInput = this.hasOwnField(updateIncomeDto, 'targetPeriod')
      ? this.normalizeOptionalPeriodValue(
          updateIncomeDto.targetPeriod,
          'targetPeriod',
        )
      : income.targetPeriod;

    const periodFields = this.resolvePeriodsByRuleType(
      ruleType,
      startPeriodInput,
      targetPeriodInput,
    );

    const isActive = this.hasOwnField(updateIncomeDto, 'isActive')
      ? this.normalizeIsActive(updateIncomeDto.isActive)
      : income.isActive;

    return {
      name,
      description,
      amount,
      ruleType,
      startPeriod: periodFields.startPeriod,
      targetPeriod: periodFields.targetPeriod,
      isActive,
    };
  }

  private resolveRuleType(ruleType: unknown): IncomeRuleType {
    if (ruleType === undefined || ruleType === null) {
      return IncomeRuleType.MONTHLY_RECURRING;
    }

    if (
      ruleType !== IncomeRuleType.MONTHLY_RECURRING &&
      ruleType !== IncomeRuleType.ONE_TIME
    ) {
      throw new BadRequestException(
        'ruleType must be MONTHLY_RECURRING or ONE_TIME',
      );
    }

    return ruleType;
  }

  private resolvePeriodsByRuleType(
    ruleType: IncomeRuleType,
    startPeriod: string | null,
    targetPeriod: string | null,
  ): { startPeriod: string | null; targetPeriod: string | null } {
    if (ruleType === IncomeRuleType.ONE_TIME) {
      const normalizedTargetPeriod =
        targetPeriod ?? this.buildCurrentPeriodValue();
      this.validatePeriodValue(normalizedTargetPeriod, 'targetPeriod');
      return {
        startPeriod: null,
        targetPeriod: normalizedTargetPeriod,
      };
    }

    const normalizedStartPeriod = startPeriod ?? this.buildCurrentPeriodValue();
    this.validatePeriodValue(normalizedStartPeriod, 'startPeriod');
    return {
      startPeriod: normalizedStartPeriod,
      targetPeriod: null,
    };
  }

  private normalizeRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new BadRequestException(`${fieldName} cannot be empty`);
    }

    return trimmedValue;
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('description must be a string');
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeAmount(value: unknown, fieldName: string): number {
    const parsedAmount = Number(value);
    if (!Number.isFinite(parsedAmount)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    if (parsedAmount < 0) {
      throw new BadRequestException(`${fieldName} cannot be negative`);
    }

    return Math.round(parsedAmount * 100) / 100;
  }

  private normalizeOptionalPeriodValue(
    value: unknown,
    fieldName: string,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    this.validatePeriodValue(trimmedValue, fieldName);
    return trimmedValue;
  }

  private normalizeIsActive(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }

    return value;
  }

  private validatePeriodValue(period: string, fieldName: string): void {
    if (!PERIOD_REGEX.test(period)) {
      throw new BadRequestException(
        `${fieldName} must use format YYYY-MM (example: 2026-03)`,
      );
    }
  }

  private buildCurrentPeriodValue(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private hasOwnField(object: object, property: string): boolean {
    return Boolean(Object.prototype.hasOwnProperty.call(object, property));
  }
}
