import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Category } from '../categories/category.entity';
import { SavingGoal } from '../savings-goals/saving-goal.entity';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { Upload } from '../uploads/upload.entity';
import { Income } from '../incomes/incomes.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ unique: true, name: 'email' })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'current_total_savings' })
  currentTotalSavings: number;

  @Column({ name: 'goal_monthly_savings' })
  goalMonthlySavings: number;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => SavingGoal, (savingGoal) => savingGoal.user)
  savingGoals: SavingGoal[];

  @OneToMany(() => FixedCommitment, (fixedCommitment) => fixedCommitment.user)
  fixedCommitments: FixedCommitment[];

  @OneToMany(() => Upload, (upload) => upload.user)
  uploads: Upload[];

  @OneToMany(() => Income, (income) => income.user)
  incomes: Income[];
}
