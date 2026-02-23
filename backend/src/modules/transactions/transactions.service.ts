import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    private readonly categoryService: CategoryService,
  ) {}

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

  async findAllByUserStatus(
    userId: string,
    status: TransactionStatus,
  ): Promise<Transaction[]> {
    const dbStatus = `${status}`;
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId }, status: dbStatus as unknown as TransactionStatus },
      relations: [...TRANSACTION_RELATIONS],
    });

    return transactions;
  }

  async findLatestByUser(
    userId: string,
    limit: number,
  ): Promise<Transaction[]> {
    const confirmedStatus = `${TransactionStatus.CONFIRMED}`;
    const transactions = await this.transactionRepository.find({
      where: { user: { id: userId }, status: confirmedStatus as unknown as TransactionStatus },
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

    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return transaction;
  }

  async create(transactionData: CreateTransactionDto): Promise<Transaction> {
    const user = await this.userService.findById(transactionData.userId);
    const category = await this.categoryService.findById(
      transactionData.categoryId,
    );
    const transaction = this.transactionRepository.create({
      ...transactionData,
      date: this.normalizeDate(transactionData.date),
      user,
      category,
    });
    return await this.transactionRepository.save(transaction);
  }

  async update(
    id: number,
    updateData: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findById(id);
    const user = await this.userService.findById(updateData.userId);
    const category = await this.categoryService.findById(updateData.categoryId);

    Object.assign(transaction, {
      ...updateData,
      date: this.normalizeDate(updateData.date),
      user,
      category,
    });
    return await this.transactionRepository.save(transaction);
  }

  async delete(id: number): Promise<void> {
    const result = await this.transactionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
  }

  async confirm(id: number): Promise<Transaction> {
    return this.confirmWithUpdates(id, {});
  }

  async confirmWithUpdates(
    id: number,
    updates: Partial<CreateTransactionDto> & { date?: Date | string },
  ): Promise<Transaction> {
    const transaction = await this.findById(id);

    if (updates.description !== undefined) {
      transaction.description = updates.description;
    }

    if (updates.amount !== undefined) {
      transaction.amount = updates.amount;
    }

    if (updates.date !== undefined) {
      transaction.date = this.normalizeDate(updates.date) as unknown as Date;
    }

    if (updates.categoryId !== undefined) {
      const category = await this.categoryService.findById(updates.categoryId);
      transaction.category = category;
    }

    transaction.status = TransactionStatus.CONFIRMED;
    return await this.transactionRepository.save(transaction);
  }

  async confirmMany(ids: number[]): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    for(const id of ids) {
      transactions.push(await this.confirm(id));
    }
    return transactions;
  }

  private normalizeDate(input: Date | string): string {
    if (typeof input === 'string') {
      const datePrefix = input.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      if (datePrefix) {
        return datePrefix;
      }
    }

    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
