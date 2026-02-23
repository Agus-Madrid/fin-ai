import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/util';
import { User } from '../user/user.entity';
import { SavingsLogStatus } from './savings-log-status.enum';

@Entity('savings_log')
@Unique('UQ_savings_log_user_period', ['user', 'period'])
export class SavingsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period', length: 7 })
  period: string;

  @Column({
    type: 'enum',
    enum: SavingsLogStatus,
    name: 'status',
    default: SavingsLogStatus.CONFIRMED,
  })
  status: SavingsLogStatus;

  @Column('decimal', {
    name: 'monthly_goal_snapshot',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  monthlyGoalSnapshot: number;

  @Column('decimal', {
    name: 'confirmed_amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  confirmedAmount: number;

  @Column('datetime', { name: 'confirmed_at', nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.savingsLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
