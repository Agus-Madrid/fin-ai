import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Income } from './incomes.entity';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dtos/create-income.dto';
import { User } from '../user/user.entity';
import { UpdateIncomeDto } from './dtos/update-income.dto';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllByUser(userId: string): Promise<Income[]> {
    return await this.incomeRepository.find({
      where: { user: { id: userId } },
    });
  }

  async create(userId: string, createIncomeDto: CreateIncomeDto): Promise<Income> {
    const user = await this.findUserById(userId);
    const income = this.incomeRepository.create({
      name: createIncomeDto.name,
      description: createIncomeDto.description,
      amount: createIncomeDto.amount,
      user,
    });
    return await this.incomeRepository.save(income);
  }

  async update(
    userId: string,
    id: string,
    updateData: UpdateIncomeDto,
  ): Promise<Income> {
    const income = await this.findByIdForUser(id, userId);

    if (updateData.name !== undefined) {
      income.name = updateData.name;
    }

    if (updateData.description !== undefined) {
      income.description = updateData.description;
    }

    if (updateData.amount !== undefined) {
      income.amount = updateData.amount;
    }

    return await this.incomeRepository.save(income);
  }

  async delete(userId: string, id: string): Promise<void> {
    const income = await this.findByIdForUser(id, userId);
    await this.incomeRepository.remove(income);
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
      throw new NotFoundException(`Income with id ${id} not found for current user`);
    }

    return income;
  }
}
