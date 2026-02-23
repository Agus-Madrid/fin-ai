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

  async create(createIncomeDto: CreateIncomeDto): Promise<Income> {
    const user = await this.findUserById(createIncomeDto.userId);
    const income = this.incomeRepository.create({
      name: createIncomeDto.name,
      description: createIncomeDto.description,
      amount: createIncomeDto.amount,
      user,
    });
    return await this.incomeRepository.save(income);
  }

  async update(id: string, updateData: UpdateIncomeDto): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }

    if (updateData.name !== undefined) {
      income.name = updateData.name;
    }

    if (updateData.description !== undefined) {
      income.description = updateData.description;
    }

    if (updateData.amount !== undefined) {
      income.amount = updateData.amount;
    }

    if (updateData.userId !== undefined) {
      income.user = await this.findUserById(updateData.userId);
    }

    return await this.incomeRepository.save(income);
  }

  async delete(id: string): Promise<void> {
    const income = await this.incomeRepository.findOne({ where: { id } });
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    await this.incomeRepository.remove(income);
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }
}
