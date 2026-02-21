import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { UserService } from '../user/user.service';
import { CategoryService } from '../categories/category.service';
import { TransactionStatus } from './transaction.enum';

const TRANSACTION_RELATIONS = ['category', 'user'] as const;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      relations: [...TRANSACTION_RELATIONS],
    });
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: [...TRANSACTION_RELATIONS],
    });

    return transactions;
  }

  async findAllByUserStatus(userId: string, status: TransactionStatus): Promise<Transaction[]> {
    const transactions = await this.transactionRepository.find({
      where: {user: { id: userId }, status},
      relations: [...TRANSACTION_RELATIONS],
    });

    return transactions;
  }

  async findLatestByUser(userId: string, limit: number): Promise<Transaction[]> {
    const status = TransactionStatus.CONFIRMED.toString() as unknown as TransactionStatus;
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId }, status },
      order: { date: 'DESC' },
      take: limit,
      relations: [...TRANSACTION_RELATIONS],
    });

    return transactions;
  }

  async findById(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: [...TRANSACTION_RELATIONS],
    });

    if(!transaction){
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return transaction;
  }

  async create(transactionData: CreateTransactionDto): Promise<Transaction> {
    const user = await this.userService.findById(transactionData.userId);
    const category = await this.categoryService.findById(transactionData.categoryId);
    const transaction = this.transactionRepository.create({
      ...transactionData,
      user,
      category
    });
    return await this.transactionRepository.save(transaction);
  }

  async update(id: number, updateData: CreateTransactionDto): Promise<Transaction> {
    const transaction = await this.findById(id);
    const user = await this.userService.findById(updateData.userId);
    const category = await this.categoryService.findById(updateData.categoryId);

    Object.assign(transaction, {...updateData,user,category});
    return await this.transactionRepository.save(transaction);
  }

  async delete(id: number): Promise<void> {
    const result = await this.transactionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
  }
}
