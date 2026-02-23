import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { SavingGoal } from '../savings-goals/saving-goal.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TransactionStatus } from '../transactions/transaction.enum';
import { Upload } from '../uploads/upload.entity';
import { User } from '../user/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
    @InjectRepository(Upload) private readonly uploads: Repository<Upload>,
    @InjectRepository(SavingGoal)
    private readonly savingGoals: Repository<SavingGoal>,
    @InjectRepository(FixedCommitment)
    private readonly fixedCommitments: Repository<FixedCommitment>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async onApplicationBootstrap() {
    const seedEmail = 'demo@finai.local';
    const user = await this.getOrCreateUser(seedEmail);

    await Promise.all([
      this.ensureTransaction(user),
      this.ensureUpload(user),
      this.ensureSavingGoal(user),
      this.ensureFixedCommitment(user),
      this.ensureCategories(user),
    ]);
  }

  private async getOrCreateUser(email: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      return existing;
    }
    const user = this.users.create({
      name: 'Demo User',
      email,
      password: 'demo',
      currentTotalSavings: 1200,
      goalMonthlySavings: 500,
    });
    return this.users.save(user);
  }

  private async ensureTransaction(user: User) {
    const count = await this.transactions.count({
      where: { user: { id: user.id } },
    });
    if (count > 0) return;

    const tx = this.transactions.create({
      amount: 45.9,
      description: 'Gasto inicial de ejemplo',
      date: new Date(),
      status: TransactionStatus.CONFIRMED,
      user,
    });
    await this.transactions.save(tx);
  }

  private async ensureUpload(user: User) {
    const count = await this.uploads.count({
      where: { user: { id: user.id } },
    });
    if (count > 0) return;

    const upload = this.uploads.create({
      filename: 'statement_demo_feb_2026.pdf',
      storageKey: 'seed/statement_demo_feb_2026.pdf',
      status: 'COMPLETED',
      user,
    });
    await this.uploads.save(upload);
  }

  private async ensureSavingGoal(user: User) {
    const count = await this.savingGoals.count({
      where: { user: { id: user.id } },
    });
    if (count > 0) return;

    const goal = this.savingGoals.create({
      name: 'Fondo de emergencia',
      targetAmount: 2500,
      deadline: this.addMonths(new Date(), 6),
      priority: 1,
      user,
    });
    await this.savingGoals.save(goal);
  }

  private async ensureFixedCommitment(user: User) {
    const count = await this.fixedCommitments.count({
      where: { user: { id: user.id } },
    });
    if (count > 0) return;

    const commitment = this.fixedCommitments.create({
      name: 'Alquiler mensual',
      amount: 850,
      user,
    });
    await this.fixedCommitments.save(commitment);
  }

  private async ensureCategories(user: User) {
    const count = await this.categories.count({
      where: { user: { id: user.id } },
    });
    if (count > 0) return;

    const categories = [
      {
        name: 'Comida',
        icon: '🍔',
        color: '#10b981',
      },
      {
        name: 'Transporte',
        icon: '🚗',
        color: '#3b82f6',
      },
      {
        name: 'Hogar',
        icon: '🏠',
        color: '#f59e0b',
      },
    ];

    const entities = categories.map((category) =>
      this.categories.create({
        ...category,
        user,
        userId: user.id,
      }),
    );

    await this.categories.save(entities);
  }

  private addMonths(date: Date, months: number) {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
  }
}
