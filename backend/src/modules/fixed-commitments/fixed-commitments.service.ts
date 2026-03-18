import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FixedCommitment } from './fixed-commitment.entity';
import { Repository } from 'typeorm';
import { CreateFixedCommitmentDto } from './dtos/create-fixed-commitment.dto';
import { User } from '../user/user.entity';
import { MonthlyFinancialsService } from '../monthly-financials/monthly-financials.service';

@Injectable()
export class FixedCommitmentsService {
  constructor(
    @InjectRepository(FixedCommitment)
    private readonly fixedCommitmentRepository: Repository<FixedCommitment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly monthlyFinancialsService: MonthlyFinancialsService,
  ) {}

  async findAllByUser(userId: string): Promise<FixedCommitment[]> {
    return await this.fixedCommitmentRepository.find({
      where: { user: { id: userId } },
    });
  }

  async create(
    userId: string,
    createFixedCommitmentDto: CreateFixedCommitmentDto,
  ): Promise<FixedCommitment> {
    const user = await this.findUserById(userId);

    const fixedCommitment = this.fixedCommitmentRepository.create({
      ...createFixedCommitmentDto,
      user,
    });
    const savedFixedCommitment =
      await this.fixedCommitmentRepository.save(fixedCommitment);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
    return savedFixedCommitment;
  }

  async update(
    userId: string,
    id: string,
    updateData: Partial<CreateFixedCommitmentDto>,
  ): Promise<FixedCommitment> {
    const fixedCommitment = await this.findByIdForUser(id, userId);
    if (updateData.name !== undefined) {
      fixedCommitment.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      fixedCommitment.description = updateData.description;
    }
    if (updateData.amount !== undefined) {
      fixedCommitment.amount = updateData.amount;
    }
    const savedFixedCommitment =
      await this.fixedCommitmentRepository.save(fixedCommitment);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
    return savedFixedCommitment;
  }

  async delete(userId: string, id: string): Promise<void> {
    const fixedCommitment = await this.findByIdForUser(id, userId);
    await this.fixedCommitmentRepository.remove(fixedCommitment);
    await this.monthlyFinancialsService.recalculateOpenPeriodsForUser(userId);
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  private async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<FixedCommitment> {
    const fixedCommitment = await this.fixedCommitmentRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!fixedCommitment) {
      throw new NotFoundException(
        `Fixed commitment with id ${id} not found for current user`,
      );
    }

    return fixedCommitment;
  }
}
