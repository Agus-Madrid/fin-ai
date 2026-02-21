import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { UserService } from '../user/user.service';
import { CategoryService } from '../categories/category.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find();
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    const transactions = await this.transactionRepository.find({ where: { user: { id: userId } } });

    if(!transactions || transactions.length === 0){
      throw new NotFoundException(`No transactions found for user with id ${userId}`);
    }
    return transactions;
  }

  async findById(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });

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
