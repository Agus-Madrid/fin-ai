import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { User } from '../user/user.entity';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction.enum';

const TRANSACTION_RELATIONS = ['category', 'user'] as const;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAllByUser(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user: { id: userId } },
      relations: [...TRANSACTION_RELATIONS],
    });
  }

  async findAllByUserStatus(
    userId: string,
    status: TransactionStatus,
  ): Promise<Transaction[]> {
    const statusValue = this.toStoredStatus(status);

    return this.transactionRepository.find({
      where: {
        user: { id: userId },
        status: statusValue as unknown as TransactionStatus,
      },
      relations: [...TRANSACTION_RELATIONS],
    });
  }

  async findLatestByUser(
    userId: string,
    limit: number,
  ): Promise<Transaction[]> {
    const confirmedStatus = this.toStoredStatus(TransactionStatus.CONFIRMED);

    return this.transactionRepository.find({
      where: {
        user: { id: userId },
        status: confirmedStatus as unknown as TransactionStatus,
      },
      order: { date: 'DESC' },
      take: limit,
      relations: [...TRANSACTION_RELATIONS],
    });
  }

  async create(
    userId: string,
    transactionData: CreateTransactionDto,
  ): Promise<Transaction> {
    const user = await this.findUserById(userId);
    const category = await this.resolveCategoryForTransactionWrite(
      transactionData.categoryId,
      userId,
    );

    const transaction = this.transactionRepository.create({
      amount: transactionData.amount,
      description: transactionData.description,
      date: this.normalizeDate(transactionData.date),
      status: transactionData.status,
      user,
      category,
    });

    return this.transactionRepository.save(transaction);
  }

  async update(
    userId: string,
    id: number,
    updateData: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findByIdForUser(id, userId);
    if (this.shouldUpdateTransactionCategory(updateData.categoryId)) {
      transaction.category = await this.resolveCategoryForTransactionWrite(
        updateData.categoryId,
        userId,
      );
    }

    Object.assign(transaction, {
      amount: updateData.amount,
      description: updateData.description,
      date: this.normalizeDate(updateData.date),
      status: updateData.status,
    });

    return this.transactionRepository.save(transaction);
  }

  async delete(userId: string, id: number): Promise<void> {
    const transaction = await this.findByIdForUser(id, userId);
    await this.transactionRepository.remove(transaction);
  }

  async deletePending(userId: string, id: number): Promise<void> {
    const transaction = await this.findByIdForUser(id, userId);
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending transactions can be skipped from review inbox',
      );
    }

    await this.transactionRepository.remove(transaction);
  }

  async confirm(userId: string, id: number): Promise<Transaction> {
    return this.confirmWithUpdates(userId, id, {});
  }

  async confirmWithUpdates(
    userId: string,
    id: number,
    updates: Partial<CreateTransactionDto> & { date?: Date | string },
  ): Promise<Transaction> {
    const transaction = await this.findByIdForUser(id, userId);

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
      transaction.category = await this.resolveCategoryForTransactionWrite(
        updates.categoryId,
        userId,
      );
    }

    transaction.status = TransactionStatus.CONFIRMED;
    return this.transactionRepository.save(transaction);
  }

  async confirmMany(userId: string, ids: number[]): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    for (const id of ids) {
      transactions.push(await this.confirm(userId, id));
    }

    return transactions;
  }

  private async findByIdForUser(
    id: number,
    userId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, user: { id: userId } },
      relations: [...TRANSACTION_RELATIONS],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${id} not found for current user`,
      );
    }

    return transaction;
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

  private toStoredStatus(status: TransactionStatus): string {
    return `${status}`;
  }

  private shouldUpdateTransactionCategory(
    categoryId: string | null | undefined,
  ): boolean {
    return categoryId !== undefined;
  }

  private async resolveCategoryForTransactionWrite(
    categoryId: string | null | undefined,
    userId: string,
  ): Promise<Category | null> {
    const normalizedCategoryId = this.normalizeCategoryId(categoryId);
    if (normalizedCategoryId === null) {
      return null;
    }

    return this.findCategoryByIdForUser(normalizedCategoryId, userId);
  }

  private normalizeCategoryId(categoryId: string | null | undefined): string | null {
    if (categoryId === null || categoryId === undefined) {
      return null;
    }

    const normalizedCategoryId = categoryId.trim();
    if (!normalizedCategoryId) {
      return null;
    }

    return normalizedCategoryId;
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  private async findCategoryByIdForUser(
    categoryId: string,
    userId: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, user: { id: userId } },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with id ${categoryId} not found for current user`,
      );
    }

    return category;
  }
}
