import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

const USER_RELATIONS = ['transactions', 'categories', 'savingGoals', 'fixedCommitments', 'uploads'] as const;

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async findAll(): Promise<User[]> {
        return await this.userRepository.find({
            relations: [...USER_RELATIONS],
        });
    }

    async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: [...USER_RELATIONS],
        });
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

}
