import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { TransactionStatus } from './transaction.enum';
import { Category } from '../categories/category.entity';
import { decimalTransformer } from '../../common/utils/util';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', {
    name: 'amount',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({ name: 'description' })
  description!: string;

  @Column('date', { name: 'date' })
  date!: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    name: 'status',
    default: TransactionStatus.CONFIRMED,
  })
  status: TransactionStatus;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn()
  category: Category;
}
