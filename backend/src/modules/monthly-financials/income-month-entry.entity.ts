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
import { Income } from '../incomes/incomes.entity';
import { IncomeRuleType } from '../incomes/income-rule-type.enum';
import { User } from '../user/user.entity';

@Entity('income_month_entries')
@Unique('UQ_income_month_entries_user_rule_period', [
  'user',
  'incomeRule',
  'period',
])
export class IncomeMonthEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period', length: 7 })
  period: string;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'source_label' })
  sourceLabel: string;

  @Column('varchar', { name: 'source_description', nullable: true, length: 255 })
  sourceDescription: string | null;

  @Column({
    type: 'enum',
    enum: IncomeRuleType,
    name: 'source_rule_type',
  })
  sourceRuleType: IncomeRuleType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.incomeMonthEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Income, (incomeRule) => incomeRule.monthEntries, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'income_rule_id' })
  incomeRule: Income | null;
}
