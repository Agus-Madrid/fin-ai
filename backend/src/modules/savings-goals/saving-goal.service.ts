import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateSavingGoalDto } from './dtos/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dtos/update-saving-goal.dto';
import { SavingGoal } from './saving-goal.entity';

@Injectable()
export class SavingGoalService {
  constructor(
    @InjectRepository(SavingGoal)
    private readonly savingGoalRepository: Repository<SavingGoal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllByUser(
    userId: string,
    activeOnly = false,
  ): Promise<SavingGoal[]> {
    await this.findUserById(userId);

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

  async create(createDto: CreateSavingGoalDto): Promise<SavingGoal> {
    const user = await this.findUserById(createDto.userId);
    const targetAmount = this.normalizeAmount(createDto.targetAmount, 'targetAmount');
    const priority = this.normalizePriority(createDto.priority);
    const deadline = this.normalizeDeadline(createDto.deadline);

    const savingGoal = this.savingGoalRepository.create({
      name: createDto.name?.trim(),
      targetAmount,
      deadline,
      priority,
      user,
    });

    if (!savingGoal.name) {
      throw new BadRequestException('name is required');
    }

    return this.savingGoalRepository.save(savingGoal);
  }

  async update(id: string, updateDto: UpdateSavingGoalDto): Promise<SavingGoal> {
    const goal = await this.savingGoalRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!goal) {
      throw new NotFoundException(`Saving goal with id ${id} not found`);
    }

    if (updateDto.name !== undefined) {
      const name = updateDto.name?.trim();
      if (!name) {
        throw new BadRequestException('name cannot be empty');
      }
      goal.name = name;
    }

    if (updateDto.targetAmount !== undefined) {
      goal.targetAmount = this.normalizeAmount(updateDto.targetAmount, 'targetAmount');
    }

    if (updateDto.priority !== undefined) {
      goal.priority = this.normalizePriority(updateDto.priority);
    }

    if (updateDto.deadline !== undefined) {
      goal.deadline = this.normalizeDeadline(updateDto.deadline);
    }

    return this.savingGoalRepository.save(goal);
  }

  async delete(id: string): Promise<void> {
    const result = await this.savingGoalRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Saving goal with id ${id} not found`);
    }
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  private normalizeAmount(value: unknown, fieldName: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    if (parsed <= 0) {
      throw new BadRequestException(`${fieldName} must be greater than 0`);
    }

    return Math.round(parsed * 100) / 100;
  }

  private normalizePriority(value?: number): number {
    const parsed = Number(value ?? 1);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('priority must be a positive integer');
    }
    return parsed;
  }

  private normalizeDeadline(value: Date | string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('deadline must be a valid date');
    }
    return date;
  }

  private getTodayDateOnly(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
