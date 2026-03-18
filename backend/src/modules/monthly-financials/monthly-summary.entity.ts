import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/util';
import { User } from '../user/user.entity';
import { MonthlySummaryStatus } from './monthly-summary-status.enum';

@Entity('monthly_summary')
@Unique('UQ_monthly_summary_user_period', ['user', 'period'])
export class MonthlySummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period', length: 7 })
  period: string;

  @Column({
    type: 'enum',
    enum: MonthlySummaryStatus,
    name: 'status',
    default: MonthlySummaryStatus.OPEN,
  })
  status: MonthlySummaryStatus;

  @Column('decimal', {
    name: 'total_income',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  totalIncome: number;

  @Column('decimal', {
    name: 'total_fixed_expenses',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  totalFixedExpenses: number;

  @Column('decimal', {
    name: 'total_savings_confirmed',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  totalSavingsConfirmed: number;

  @Column('decimal', {
    name: 'net_balance',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  netBalance: number;

  @Column('datetime', { name: 'calculated_at' })
  calculatedAt: Date;

  @Column('datetime', { name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.monthlySummaries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
