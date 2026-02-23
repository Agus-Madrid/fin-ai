import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FixedCommitment } from './fixed-commitment.entity';
import { Repository } from 'typeorm';
import { CreateFixedCommitmentDto } from './dtos/create-fixed-commitment.dto';
import { User } from '../user/user.entity';

@Injectable()
export class FixedCommitmentsService {
    constructor(
        @InjectRepository(FixedCommitment)
        private readonly fixedCommitmentRepository: Repository<FixedCommitment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async findAllByUser(userId: string): Promise<FixedCommitment[]> {
        return await this.fixedCommitmentRepository.find({
            where: { user: { id: userId } },
        });
    }

    async create(createFixedCommitmentDto: CreateFixedCommitmentDto): Promise<FixedCommitment> {
        const user = await this.findUserById(createFixedCommitmentDto.userId);
        
        const fixedCommitment = this.fixedCommitmentRepository.create({
            ...createFixedCommitmentDto,
            user,
        });
        return await this.fixedCommitmentRepository.save(fixedCommitment);
    }

    async update(id: string, updateData: Partial<CreateFixedCommitmentDto>): Promise<FixedCommitment> {
        const fixedCommitment = await this.fixedCommitmentRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!fixedCommitment) {
            throw new NotFoundException(`Fixed commitment with id ${id} not found`);
        }
        if (updateData.name !== undefined) {
            fixedCommitment.name = updateData.name;
        }
        if (updateData.description !== undefined) {
            fixedCommitment.description = updateData.description;
        }
        if (updateData.amount !== undefined) {
            fixedCommitment.amount = updateData.amount;
        }
        if (updateData.userId !== undefined) {
            fixedCommitment.user = await this.findUserById(updateData.userId);
        }
        return await this.fixedCommitmentRepository.save(fixedCommitment);
    }

    async delete(id: string): Promise<void> {
        const result = await this.fixedCommitmentRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Fixed commitment with id ${id} not found`);
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
