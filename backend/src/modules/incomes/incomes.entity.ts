import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/utils/util';
import { IncomeMonthEntry } from '../monthly-financials/income-month-entry.entity';
import { IncomeRuleType } from './income-rule-type.enum';
import { User } from '../user/user.entity';

@Entity('income_rules')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column('varchar', { name: 'description', nullable: true, length: 255 })
  description: string | null;

  @Column({
    type: 'enum',
    enum: IncomeRuleType,
    name: 'rule_type',
    default: IncomeRuleType.MONTHLY_RECURRING,
  })
  ruleType: IncomeRuleType;

  @Column('varchar', { name: 'start_period', length: 7, nullable: true })
  startPeriod: string | null;

  @Column('varchar', { name: 'target_period', length: 7, nullable: true })
  targetPeriod: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => IncomeMonthEntry, (monthEntry) => monthEntry.incomeRule)
  monthEntries: IncomeMonthEntry[];

  @ManyToOne(() => User, (user) => user.incomes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
